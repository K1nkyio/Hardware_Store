import { useEffect } from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy - Raph Supply";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-6">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <header className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-light text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: March 23, 2026</p>
          </header>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Introduction</h2>
              <p className="leading-relaxed text-muted-foreground">
                At Raph Supply, we respect your privacy and are committed to protecting the personal information you share
                with us when you browse our website, place orders, create an account, or contact customer care.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-xl font-light text-foreground">Information you provide</h3>
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Name, email address, and contact details</li>
                    <li>Shipping and billing addresses</li>
                    <li>Order details and customer support messages</li>
                    <li>Account preferences and saved payment method labels</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-light text-foreground">Information collected automatically</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    We may collect usage and device information such as IP address, browser type, pages visited, order
                    journey events, and device identifiers to help operate and improve the store.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">How We Use Your Information</h2>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Process and fulfill orders</li>
                <li>Coordinate delivery, pickup, and customer support</li>
                <li>Protect the store from fraud and abuse</li>
                <li>Improve product discovery, checkout, and account experience</li>
                <li>Send service and marketing messages where permitted</li>
                <li>Comply with legal and tax obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Information Sharing</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We do not sell your personal information. We may share limited data with third parties only when required to
                run the business, including payment processors, logistics partners, support tools, hosting providers, or
                authorities where required by law.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Data Security</h2>
              <p className="leading-relaxed text-muted-foreground">
                We use reasonable technical and organizational measures to protect your information. However, no website,
                network, or storage system can be guaranteed to be completely secure.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Cookies and Analytics</h2>
              <p className="leading-relaxed text-muted-foreground">
                We use cookies and similar technologies to maintain sessions, remember preferences, analyze store usage,
                and improve storefront performance. You can manage cookie behavior through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Your Choices</h2>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Review and update certain account details from your account page</li>
                <li>Request correction of inaccurate personal information</li>
                <li>Request deletion where legally permissible</li>
                <li>Opt out of non-essential promotional communications</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Changes to This Policy</h2>
              <p className="leading-relaxed text-muted-foreground">
                We may update this policy from time to time. When we make material changes, we will update the date at the
                top of this page.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-light text-foreground">Contact Us</h2>
              <div className="text-muted-foreground">
                <p>Email: hello@raphsupply.com</p>
                <p>Phone: +63 (2) 8555-0123</p>
                <p>Address: 123 Hardware Avenue, Metro Manila, Philippines</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
