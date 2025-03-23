
import React from 'react';
import NavBar from '@/components/NavBar';
import ContactForm from '@/components/ContactForm';

const Contact = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <div className="container mx-auto px-4 pt-20 pb-10 flex-1">
        <div className="max-w-4xl mx-auto mt-8">
          <h1 className="text-3xl font-bold text-center mb-8">Contact Us</h1>
          <div className="mb-8 text-center">
            <p className="text-muted-foreground">
              Have a question, suggestion, or found a bug? We'd love to hear from you!
            </p>
          </div>
          <ContactForm />
        </div>
      </div>
    </div>
  );
};

export default Contact;
