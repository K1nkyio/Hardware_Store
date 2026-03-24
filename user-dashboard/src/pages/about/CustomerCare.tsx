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
    "https://wa.me/63285550123?text=Hello%20Raph%20Supply%20customer%20care%2C%20I%20need%20assistance%20with%20my%20order.";

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
            subtitle="Support for orders, product questions, delivery issues, and trade sourcing"
          />

          <ContentSection title="Contact Information">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Phone</h3>
                <p className="text-muted-foreground">+63 (2) 8555-0123</p>
                <p className="text-sm text-muted-foreground">Mon-Sat: 8AM-6PM PHT</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Email</h3>
                <p className="text-muted-foreground">hello@raphsupply.com</p>
                <p className="text-sm text-muted-foreground">Most requests answered within one business day</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">WhatsApp</h3>
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="rounded-none">
                    Open WhatsApp
                  </Button>
                </a>
                <p className="text-sm text-muted-foreground">Share your order number or required item list for faster help</p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Frequently Asked Questions">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem id="shipping" value="shipping" className="rounded-lg border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What shipping options and delivery timelines do you offer?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Delivery options vary by area, item size, and stock availability. Standard delivery, express dispatch,
                  and click-and-collect may be available depending on your order. Final options are shown during checkout.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="returns" className="rounded-lg border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What is your return policy?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Unused items in resalable condition may be eligible for return within the approved return window.
                  Special-order materials, cut items, opened consumables, and goods damaged during installation may not qualify.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="warranty" className="rounded-lg border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Do your products come with warranty support?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Warranty coverage depends on the product category and manufacturer. Equipment, electrical items, and tools
                  may carry brand-backed warranty terms, while consumables and clearance stock may be excluded.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="selection" className="rounded-lg border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Can you help me choose the right item before I order?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. Send the product link, application details, size requirements, or site photos through the contact
                  form and our team will help narrow down compatible options.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bulk" className="rounded-lg border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  Do you support bulk or repeat purchasing?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. We work with contractors, building admins, facilities teams, and procurement buyers who need repeat
                  ordering, consolidated delivery, or recurring restocks.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="prepare" className="rounded-lg border border-border px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  What should I prepare before contacting customer care?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Include your order number, product name or SKU, quantity, installation context, and photos if you are
                  reporting a compatibility problem, missing item, or product defect.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ContentSection>

          <ContentSection title="Contact Form">
            <div id="contact-form">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-6 md:grid-cols-2">
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
                    className="min-h-[120px] rounded-none"
                    placeholder="Describe your inquiry, required item, or issue in detail"
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
