'use client';

interface CopyrightFooterProps {
  dictionary: {
    footer: {
      rights: string;
    };
  };
}

export default function CopyrightFooter({ dictionary }: CopyrightFooterProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="copyright-footer">
      <div className="container mx-auto">
        <p>&copy; {currentYear} E-Voque. {dictionary.footer.rights}</p>
      </div>
    </div>
  );
} 