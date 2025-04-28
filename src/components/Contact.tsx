'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon 
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface ContactProps {
  dictionary: {
    contact: {
      title: string;
      description: string;
      phone: string;
      email: string;
      address: string;
      form: {
        name: string;
        email: string;
        message: string;
        submit: string;
      };
    };
  };
}

export default function Contact({ dictionary }: ContactProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formState);
    // Reset form
    setFormState({ name: '', email: '', message: '' });
    // Show success message
    alert('Thank you for your message! We will get back to you soon.');
  };

  const contactInfo = [
    {
      icon: <PhoneIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.contact.phone,
      info: '+1 (555) 123-4567',
    },
    {
      icon: <EnvelopeIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.contact.email,
      info: 'info@e-voque.com',
    },
    {
      icon: <MapPinIcon className="h-6 w-6 text-primary-600" />,
      title: dictionary.contact.address,
      info: '123 Interpretation St, San Francisco, CA 94105',
    },
  ];

  return (
    <section id="contact" className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {dictionary.contact.title}
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
            {dictionary.contact.description}
          </p>
        </motion.div>

        {/* Map Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16 rounded-lg overflow-hidden shadow-lg"
        >
          <div className="relative h-64 md:h-96 bg-primary-100">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-200 to-primary-50"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <MapPinIcon className="h-16 w-16 text-primary-600 mb-4" />
              <div className="text-primary-600 text-xl font-bold">Our Location</div>
              <div className="text-primary-500 text-sm mt-2">123 Interpretation St, San Francisco, CA 94105</div>
            </div>
            
            {/* Map grid lines */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border border-primary-200 opacity-30"></div>
              ))}
            </div>
            
            {/* Map pin marker */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <div className="h-3 w-3 bg-white rounded-full"></div>
              </div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-t-red-500 border-l-transparent border-r-transparent"></div>
            </div>
            
            {/* Map decoration - roads */}
            <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-primary-300 opacity-40"></div>
            <div className="absolute top-2/3 left-0 right-0 h-0.5 bg-primary-300 opacity-40"></div>
            <div className="absolute bottom-1/4 left-0 right-0 h-0.5 bg-primary-300 opacity-40"></div>
            <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-primary-300 opacity-40"></div>
            <div className="absolute left-2/3 top-0 bottom-0 w-0.5 bg-primary-300 opacity-40"></div>
            
            <div className="absolute bottom-2 right-2 bg-white py-1 px-2 rounded text-xs text-gray-600 font-medium shadow-sm">
              Map placeholder - Replace with actual map
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
              
              <div className="space-y-6">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 bg-primary-100 p-3 rounded-full mr-4">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{item.title}</h4>
                      <p className="text-gray-600">{item.info}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {dictionary.contact.form.name}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    {dictionary.contact.form.email}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    {dictionary.contact.form.message}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full btn-primary py-3"
                >
                  {dictionary.contact.form.submit}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 