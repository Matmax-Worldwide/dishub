'use client';

import React, { useState, useEffect } from 'react';
import { gqlRequest } from '@/lib/graphql-client';
import { 
  MessageCircle, 
  Reply, 
  ThumbsUp, 
  ThumbsDown,
  Flag,
  MoreHorizontal,
  Edit,
  Trash2,
  Check,
  X,
  Calendar,
  Filter,
  Search,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CommentFilter } from '@/types/blog';

interface Comment {
  id: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
  createdAt: string;
  updatedAt: string;
  likes: number;
  dislikes: number;
  isEdited: boolean;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isVerified: boolean;
  };
  post: {
    id: string;
    title: string;
    slug: string;
  };
  parent?: {
    id: string;
    author: {
      name: string;
    };
  };
  replies: Comment[];
  reports: number;
}

interface BlogCommentsProps {
  postId?: string;
  blogId?: string;
  locale?: string;
  moderationMode?: boolean;
}

export function BlogComments({ postId, blogId, moderationMode = false }: BlogCommentsProps) {
  // State management
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CommentFilter['status']>('PENDING');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'likes' | 'reports'>('newest');
  
  // Dialog states
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  
  // Form states
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [commentToModerate, setCommentToModerate] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [moderationReason, setModerationReason] = useState('');

  // Load data
  useEffect(() => {
    loadComments();
  }, [postId, blogId, statusFilter, sortBy]);

  async function loadComments() {
    setLoading(true);
    try {
      const filter: CommentFilter = {};
      
      if (postId) {
        filter.postId = postId;
      } else if (blogId) {
        filter.blogId = blogId;
      }
      
      if (statusFilter !== 'PENDING') {
        filter.status = statusFilter as CommentFilter['status'];
      }

      const query = `
        query GetComments($filter: CommentFilter, $sort: CommentSort) {
          comments(filter: $filter, sort: $sort) {
            id
            content
            status
            createdAt
            updatedAt
            likes
            dislikes
            isEdited
            reports
            author {
              id
              name
              email
              avatar
              isVerified
            }
            post {
              id
              title
              slug
            }
            parent {
              id
              author {
                name
              }
            }
            replies {
              id
              content
              status
              createdAt
              likes
              dislikes
              author {
                id
                name
                avatar
                isVerified
              }
            }
          }
        }
      `;

      const variables = {
        filter,
        sort: {
          field: sortBy === 'newest' ? 'createdAt' : 
                 sortBy === 'oldest' ? 'createdAt' :
                 sortBy === 'likes' ? 'likes' : 'reports',
          direction: sortBy === 'oldest' ? 'ASC' : 'DESC'
        }
      };

      const response = await gqlRequest<{ comments: Comment[] }>(query, variables);
      setComments(response.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!replyContent.trim() || !replyingTo) {
      toast.error('Reply content is required');
      return;
    }

    try {
      const mutation = `
        mutation CreateComment($input: CreateCommentInput!) {
          createComment(input: $input) {
            success
            message
            comment {
              id
              content
            }
          }
        }
      `;

      const variables = {
        input: {
          content: replyContent,
          postId: replyingTo.post.id,
          parentId: replyingTo.id
        }
      };

      const response = await gqlRequest<{ createComment: { success: boolean; message: string } }>(
        mutation, 
        variables
      );

      if (response.createComment.success) {
        toast.success('Reply posted successfully');
        setReplyDialogOpen(false);
        setReplyingTo(null);
        setReplyContent('');
        loadComments();
      } else {
        throw new Error(response.createComment.message);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    }
  }

  async function handleEdit() {
    if (!editContent.trim() || !editingComment) {
      toast.error('Comment content is required');
      return;
    }

    try {
      const mutation = `
        mutation UpdateComment($id: ID!, $input: UpdateCommentInput!) {
          updateComment(id: $id, input: $input) {
            success
            message
          }
        }
      `;

      const variables = {
        id: editingComment.id,
        input: {
          content: editContent
        }
      };

      const response = await gqlRequest<{ updateComment: { success: boolean; message: string } }>(
        mutation, 
        variables
      );

      if (response.updateComment.success) {
        toast.success('Comment updated successfully');
        setEditDialogOpen(false);
        setEditingComment(null);
        setEditContent('');
        loadComments();
      } else {
        throw new Error(response.updateComment.message);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  }

  async function handleDelete() {
    if (!commentToDelete) return;

    try {
      const mutation = `
        mutation DeleteComment($id: ID!) {
          deleteComment(id: $id) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ deleteComment: { success: boolean; message: string } }>(
        mutation, 
        { id: commentToDelete.id }
      );

      if (response.deleteComment.success) {
        toast.success('Comment deleted successfully');
        loadComments();
      } else {
        throw new Error(response.deleteComment.message);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  }

  async function handleModeration(action: 'approve' | 'reject' | 'spam') {
    if (!commentToModerate) return;

    try {
      const mutation = `
        mutation ModerateComment($id: ID!, $action: ModerationAction!, $reason: String) {
          moderateComment(id: $id, action: $action, reason: $reason) {
            success
            message
          }
        }
      `;

      const variables = {
        id: commentToModerate.id,
        action: action.toUpperCase(),
        reason: moderationReason || null
      };

      const response = await gqlRequest<{ moderateComment: { success: boolean; message: string } }>(
        mutation, 
        variables
      );

      if (response.moderateComment.success) {
        toast.success(`Comment ${action}ed successfully`);
        loadComments();
      } else {
        throw new Error(response.moderateComment.message);
      }
    } catch (error) {
      console.error('Error moderating comment:', error);
      toast.error('Failed to moderate comment');
    } finally {
      setModerationDialogOpen(false);
      setCommentToModerate(null);
      setModerationReason('');
    }
  }

  function openReplyDialog(comment: Comment) {
    setReplyingTo(comment);
    setReplyDialogOpen(true);
  }

  function openEditDialog(comment: Comment) {
    setEditingComment(comment);
    setEditContent(comment.content);
    setEditDialogOpen(true);
  }

  function openDeleteDialog(comment: Comment) {
    setCommentToDelete(comment);
    setDeleteDialogOpen(true);
  }

  function openModerationDialog(comment: Comment) {
    setCommentToModerate(comment);
    setModerationDialogOpen(true);
  }

  // Filter comments based on search
  const filteredComments = comments.filter(comment =>
    comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Comment['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SPAM':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Comment['status']) => {
    switch (status) {
      case 'APPROVED':
        return <Check className="h-3 w-3" />;
      case 'PENDING':
        return <AlertTriangle className="h-3 w-3" />;
      case 'REJECTED':
        return <X className="h-3 w-3" />;
      case 'SPAM':
        return <Flag className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            {moderationMode ? 'Comment Moderation' : 'Comments'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {moderationMode 
              ? 'Review and moderate user comments'
              : 'Manage blog comments and discussions'
            }
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CommentFilter['status'])}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="SPAM">Spam</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'oldest' | 'likes' | 'reports')}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="likes">Most Liked</SelectItem>
                <SelectItem value="reports">Most Reported</SelectItem>
              </SelectContent>
            </Select>

            {/* Stats */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredComments.length} comments</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No comments found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search criteria' : 'No comments to display'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredComments.map(comment => (
            <Card key={comment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Comment Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback>
                          {comment.author.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.author.name}</span>
                          {comment.author.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(comment.createdAt)}</span>
                          {comment.isEdited && (
                            <Badge variant="outline" className="text-xs">
                              Edited
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(comment.status)}>
                        {getStatusIcon(comment.status)}
                        <span className="ml-1">{comment.status}</span>
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openReplyDialog(comment)}>
                            <Reply className="h-4 w-4 mr-2" />
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(comment)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {moderationMode && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openModerationDialog(comment)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Moderate
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(comment)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="pl-13">
                    {comment.parent && (
                      <div className="mb-2 p-2 bg-muted rounded text-sm">
                        Replying to <span className="font-medium">{comment.parent.author.name}</span>
                      </div>
                    )}
                    <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                  </div>

                  {/* Comment Actions */}
                  <div className="flex items-center justify-between pl-13">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {comment.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {comment.dislikes}
                      </Button>
                      {comment.reports > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <Flag className="h-3 w-3 mr-1" />
                          {comment.reports} reports
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Post: <span className="font-medium">{comment.post.title}</span>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="pl-13 space-y-3 border-l-2 border-muted ml-6">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={reply.author.avatar} />
                              <AvatarFallback className="text-xs">
                                {reply.author.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{reply.author.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(reply.createdAt)}
                            </span>
                            <Badge className={getStatusColor(reply.status)} variant="outline">
                              {reply.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{reply.content}</p>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {reply.likes}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              {reply.dislikes}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Comment</DialogTitle>
            <DialogDescription>
              Replying to {replyingTo?.author.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="replyContent">Your Reply</Label>
              <Textarea
                id="replyContent"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReply}>
              <Reply className="h-4 w-4 mr-2" />
              Post Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Comment</DialogTitle>
            <DialogDescription>
              Make changes to your comment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="editContent">Comment Content</Label>
              <Textarea
                id="editContent"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Update Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Moderation Dialog */}
      <Dialog open={moderationDialogOpen} onOpenChange={setModerationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderate Comment</DialogTitle>
            <DialogDescription>
              Choose an action for this comment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="moderationReason">Reason (Optional)</Label>
              <Textarea
                id="moderationReason"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Reason for moderation action..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setModerationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={() => handleModeration('approve')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleModeration('reject')}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleModeration('spam')}
            >
              <Flag className="h-4 w-4 mr-2" />
              Mark as Spam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 