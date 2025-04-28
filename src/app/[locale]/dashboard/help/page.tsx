'use client';

import { useState } from 'react';
import { HelpCircleIcon, MailIcon, BookOpenIcon } from 'lucide-react';

// Sample FAQ data
const FAQS = [
  {
    id: '1',
    question: 'How do I update my profile information?',
    answer: 'You can update your profile by navigating to the Settings page and selecting the Account tab. There you can edit your personal information and contact details.',
    category: 'account'
  },
  {
    id: '2',
    question: 'How do I change my notification preferences?',
    answer: 'Go to Settings > Notifications where you can choose which types of notifications you want to receive and through which channels.',
    category: 'notifications'
  },
  {
    id: '3',
    question: 'What types of assignments can I expect?',
    answer: 'As an interpreter, you may receive various types of assignments including in-person interpretation, virtual meetings, document translation, and phone calls depending on your qualifications and availability.',
    category: 'assignments'
  },
  {
    id: '4',
    question: 'How do I report a technical issue?',
    answer: 'Technical issues can be reported through the Contact Support tab in the Help section. Please provide as much detail as possible about the issue you encountered.',
    category: 'technical'
  },
  {
    id: '5',
    question: 'When and how do I get paid?',
    answer: 'Payments are typically processed on the 15th and last day of each month. You can view your payment history and status in the Payments section of your dashboard.',
    category: 'billing'
  }
];

// Documentation resources
const RESOURCES = [
  {
    title: 'Getting Started Guide',
    description: 'Learn the basics of using the platform and set up your account.',
    link: '/docs/getting-started',
    icon: '📘'
  },
  {
    title: 'Interpreter Handbook',
    description: 'Comprehensive guide on interpretation best practices and policies.',
    link: '/docs/interpreter-handbook',
    icon: '📔'
  },
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video guides for common tasks and features.',
    link: '/docs/videos',
    icon: '🎬'
  },
  {
    title: 'FAQ Database',
    description: 'Browse our complete database of frequently asked questions.',
    link: '/docs/faq',
    icon: '❓'
  }
];

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState('faqs');
  const [faqCategory, setFaqCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [supportForm, setSupportForm] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Filter FAQs based on category and search
  const filteredFAQs = FAQS.filter(faq => {
    const matchesCategory = faqCategory === 'all' || faq.category === faqCategory;
    const matchesSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API submission
    setTimeout(() => {
      setFormSubmitted(true);
      // Reset form
      setSupportForm({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'general'
      });
    }, 500);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSupportForm({
      ...supportForm,
      [name]: value
    });
  };
  
  const tabs = [
    { id: 'faqs', label: 'FAQs', icon: HelpCircleIcon },
    { id: 'support', label: 'Contact Support', icon: MailIcon },
    { id: 'docs', label: 'Documentation', icon: BookOpenIcon }
  ];
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Help & Support</h1>
      
      {formSubmitted && (
        <div className="p-4 rounded-md bg-green-50 text-green-800 mb-4">
          Your support request has been submitted successfully. Our team will get back to you soon.
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium flex items-center ${
                  activeTab === tab.id
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {/* FAQs Section */}
          {activeTab === 'faqs' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Frequently Asked Questions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Find answers to common questions about our platform.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4">
                <div className="w-full sm:w-1/3">
                  <select
                    id="faq-category"
                    name="faq-category"
                    value={faqCategory}
                    onChange={(e) => setFaqCategory(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="all">All Categories</option>
                    <option value="account">Account</option>
                    <option value="notifications">Notifications</option>
                    <option value="assignments">Assignments</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                  </select>
                </div>
                
                <div className="w-full sm:w-2/3">
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
              
              <div className="mt-6 space-y-6">
                {filteredFAQs.length > 0 ? (
                  <dl className="space-y-6 divide-y divide-gray-200">
                    {filteredFAQs.map((faq) => (
                      <div key={faq.id} className="pt-6 first:pt-0">
                        <dt className="text-base font-medium text-gray-900">
                          {faq.question}
                        </dt>
                        <dd className="mt-2 text-sm text-gray-500">
                          {faq.answer}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="text-center py-6">
                    <HelpCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No matching FAQs</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filter to find what you&apos;re looking for.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Contact Support Section */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Contact Support</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Submit a support ticket and our team will get back to you as soon as possible.
                </p>
              </div>
              
              <form onSubmit={handleSupportSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      value={supportForm.subject}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      id="category"
                      name="category"
                      value={supportForm.category}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing Question</option>
                      <option value="assignments">Assignment Related</option>
                      <option value="feature">Feature Request</option>
                    </select>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      value={supportForm.priority}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={supportForm.description}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Please provide detailed information about your issue"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Documentation Section */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Documentation & Resources</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Explore our documentation and resources to learn more about the platform.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {RESOURCES.map((resource) => (
                  <div key={resource.title} className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-start space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <div className="flex-shrink-0 text-2xl">
                      {resource.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={resource.link} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                        <p className="text-sm text-gray-500 truncate">{resource.description}</p>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Need more help? Contact our support team at <a href="mailto:support@e-voque.com" className="font-medium text-indigo-600 hover:text-indigo-500">support@e-voque.com</a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 