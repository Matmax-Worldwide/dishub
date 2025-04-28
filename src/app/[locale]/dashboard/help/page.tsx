'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';

// GraphQL Queries and Mutations
const GET_FAQS = gql`
  query GetFAQs {
    faqs {
      id
      question
      answer
      category
    }
  }
`;

const CREATE_SUPPORT_TICKET = gql`
  mutation CreateSupportTicket($input: CreateSupportTicketInput!) {
    createSupportTicket(input: $input) {
      id
      subject
      status
      createdAt
    }
  }
`;

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export default function HelpPage() {
  // State for FAQ filter
  const [faqCategory, setFaqCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for support ticket form
  const [supportTicket, setSupportTicket] = useState<SupportTicket>({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general',
  });
  
  // State for selected help section
  const [activeSection, setActiveSection] = useState('faqs');
  
  // State for feedback
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // GraphQL hooks
  const { loading, error, data } = useQuery(GET_FAQS, {
    client,
  });
  
  const [createSupportTicket] = useMutation(CREATE_SUPPORT_TICKET, {
    client,
    onCompleted: () => {
      setNotification({ type: 'success', message: 'Support ticket submitted successfully! Our team will get back to you soon.' });
      setSupportTicket({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'general',
      });
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    },
    onError: (error) => {
      setNotification({ type: 'error', message: `Error submitting ticket: ${error.message}` });
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    },
  });
  
  // Filter FAQs based on category and search
  const filteredFAQs = data?.faqs.filter((faq: FAQ) => {
    const matchesCategory = faqCategory === 'all' || faq.category === faqCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];
  
  // Support ticket categories
  const ticketCategories = [
    { id: 'general', name: 'General Inquiry' },
    { id: 'technical', name: 'Technical Issue' },
    { id: 'billing', name: 'Billing Question' },
    { id: 'feature', name: 'Feature Request' },
    { id: 'bug', name: 'Bug Report' },
  ];
  
  // Documentation resources
  const documentationResources = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of using the platform and set up your account.',
      link: '/docs/getting-started',
      icon: '📘',
    },
    {
      title: 'API Documentation',
      description: 'Comprehensive documentation for our API endpoints and integration.',
      link: '/docs/api',
      icon: '🔌',
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides for common tasks and features.',
      link: '/docs/videos',
      icon: '🎬',
    },
    {
      title: 'Best Practices',
      description: 'Tips and recommendations for getting the most out of the platform.',
      link: '/docs/best-practices',
      icon: '✨',
    },
    {
      title: 'Troubleshooting Guide',
      description: 'Solutions to common issues and error messages.',
      link: '/docs/troubleshooting',
      icon: '🔧',
    },
  ];
  
  // Handle support ticket form submission
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await createSupportTicket({
      variables: {
        input: supportTicket,
      },
    });
  };
  
  // Handle support ticket form field changes
  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSupportTicket({
      ...supportTicket,
      [name]: value,
    });
  };
  
  if (loading) return <div className="flex justify-center p-6">Loading help resources...</div>;
  if (error) return <div className="text-red-500 p-6">Error loading help resources: {error.message}</div>;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Help & Support</h1>
      
      {notification && (
        <div className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {notification.message}
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveSection('faqs')}
              className={`px-6 py-4 text-sm font-medium ${
                activeSection === 'faqs'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              FAQs
            </button>
            <button
              onClick={() => setActiveSection('support')}
              className={`px-6 py-4 text-sm font-medium ${
                activeSection === 'support'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contact Support
            </button>
            <button
              onClick={() => setActiveSection('docs')}
              className={`px-6 py-4 text-sm font-medium ${
                activeSection === 'docs'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Documentation
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeSection === 'faqs' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Find answers to common questions about our platform.
                </p>
              </div>
              
              <div className="flex items-center space-x-4 pb-4">
                <div className="w-1/3">
                  <select
                    id="faq-category"
                    name="faq-category"
                    value={faqCategory}
                    onChange={(e) => setFaqCategory(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="all">All Categories</option>
                    <option value="account">Account</option>
                    <option value="billing">Billing</option>
                    <option value="features">Features</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
                
                <div className="w-2/3">
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search FAQs"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-10 px-6">
                  <p className="text-gray-500">No FAQs found matching your criteria. Try adjusting your filters or search.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFAQs.map((faq: FAQ) => (
                    <details key={faq.id} className="bg-gray-50 p-4 rounded-lg">
                      <summary className="font-medium text-gray-900 cursor-pointer">
                        {faq.question}
                      </summary>
                      <div className="mt-3 text-gray-700">
                        <p>{faq.answer}</p>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeSection === 'support' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Contact Support</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Submit a support ticket and our team will assist you as soon as possible.
                </p>
              </div>
              
              <form onSubmit={handleSubmitTicket} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="subject"
                        id="subject"
                        required
                        value={supportTicket.subject}
                        onChange={handleTicketChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <div className="mt-1">
                      <select
                        id="category"
                        name="category"
                        required
                        value={supportTicket.category}
                        onChange={handleTicketChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        {ticketCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <div className="mt-1">
                      <select
                        id="priority"
                        name="priority"
                        required
                        value={supportTicket.priority}
                        onChange={handleTicketChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={5}
                        required
                        value={supportTicket.description}
                        onChange={handleTicketChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Please describe your issue in detail, including any error messages you've received."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-5">
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
          
          {activeSection === 'docs' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Documentation Resources</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Browse our comprehensive documentation to learn more about the platform.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {documentationResources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.link}
                    className="block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition duration-150"
                  >
                    <div className="text-3xl mb-3">{resource.icon}</div>
                    <h3 className="text-base font-medium text-gray-900">{resource.title}</h3>
                    <p className="mt-2 text-sm text-gray-500">{resource.description}</p>
                  </a>
                ))}
              </div>
              
              <div className="mt-6 p-6 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base font-medium text-indigo-800">Need more help?</h3>
                    <div className="mt-2 text-sm text-indigo-700">
                      <p>If you can&apos;t find what you&apos;re looking for in our documentation, you can:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Join our community forum for peer support</li>
                        <li>Schedule a call with our customer success team</li>
                        <li>Attend one of our weekly live webinars</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 