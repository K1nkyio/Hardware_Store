import { useState, type FormEvent } from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import AboutSidebar from "../../components/about/AboutSidebar";
import { submitCustomerInquiry } from "@/lib/api";

const CustomerCare = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const whatsappLink =
    "https://wa.me/63285550123?text=Hello%20RAPH%20customer%20care%2C%20I%20need%20assistance%20with%20my%20order.";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackMessage("");
    setErrorMessage("");

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !message.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCustomerInquiry({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        orderNumber: orderNumber.trim() || undefined,
        message: message.trim(),
      });
      setFeedbackMessage("Your message was submitted. Customer care will review it shortly.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setOrderNumber("");
      setMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send your message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full flex-1 px-4 sm:px-5 lg:pl-2 lg:pr-6">
        <PageHeader 
          title="Customer Care" 
          subtitle="We're here to help you with all your jewelry needs"
        />
        
        <ContentSection title="Contact Information">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">Phone</h3>
              <p className="text-muted-foreground">+1 (555) 123-4567</p>
              <p className="text-sm text-muted-foreground">Mon-Fri: 9AM-6PM EST<br />Sat: 10AM-4PM EST</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">Email</h3>
              <p className="text-muted-foreground">care@lineajewelry.com</p>
              <p className="text-sm text-muted-foreground">Response within 24 hours</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-light text-foreground">Enquire via WhatsApp</h3>
              <a href={whatsappLink} target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-none">
                  Open WhatsApp
                </Button>
              </a>
              <p className="text-sm text-muted-foreground">Start a chat with our customer care team</p>
            </div>
          </div>
        </ContentSection>

        <ContentSection title="Frequently Asked Questions">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem id="shipping" value="shipping" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                What are your shipping options and timeframes?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We offer free standard shipping (3-5 business days) on orders over $500. Express shipping (1-2 business days) is available for $25. All orders are fully insured and require signature confirmation.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="returns" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                What is your return and exchange policy?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We offer a 30-day return policy for unworn items in original condition. Custom and engraved pieces are final sale. Returns are free with our prepaid return label.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="warranty" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                What warranty do you offer on your jewelry?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                All LINEA jewelry comes with a lifetime warranty against manufacturing defects. This includes free repairs for normal wear and tear, stone tightening, and professional cleaning.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sizing" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                Can I resize my jewelry after purchase?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, we offer free ring resizing within 60 days of purchase (up to 2 sizes). Additional resizing is available for a service fee. Some designs cannot be resized due to their construction.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="care" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                How should I care for my LINEA jewelry?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Store pieces separately in soft pouches, avoid contact with chemicals and cosmetics, and clean gently with a soft cloth. We recommend professional cleaning every 6-12 months.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="authentication" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                How can I verify the authenticity of my jewelry?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Every LINEA piece comes with a certificate of authenticity and is hallmarked. You can verify authenticity on our website using your unique piece number or contact our customer care team.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ContentSection>

        <ContentSection title="Contact Form">
          <div id="contact-form">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-light text-foreground">First Name</label>
                  <Input
                    className="rounded-none"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-light text-foreground">Last Name</label>
                  <Input
                    className="rounded-none"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">Email</label>
                <Input
                  type="email"
                  className="rounded-none"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">Order Number (Optional)</label>
                <Input
                  className="rounded-none"
                  placeholder="Enter your order number if applicable"
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-light text-foreground">How can we help you?</label>
                <Textarea 
                  className="rounded-none min-h-[120px]" 
                  placeholder="Please describe your inquiry in detail"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                />
              </div>
              
              {(feedbackMessage || errorMessage) && (
                <p className={`text-sm font-light ${errorMessage ? "text-destructive" : "text-emerald-600"}`}>
                  {errorMessage || feedbackMessage}
                </p>
              )}

              <Button type="submit" className="w-full rounded-none" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default CustomerCare;
