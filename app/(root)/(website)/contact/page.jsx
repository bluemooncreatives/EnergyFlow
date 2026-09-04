"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import styles from "./contact.module.css";
import { PhoneInput } from "@/components/ui/phone-input";

const ContactPage = () => {
  const container = useRef();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState(null);

  useGSAP(
    () => {
      gsap.to(`.${styles.contactHeading} h1`, {
        y: 0,
        duration: 1.2,
        delay: 0.8,
        ease: "power4.out",
      });

      gsap.to(
        [`.${styles.sectionLabel} p`, `.${styles.item} p`, `.${styles.item} a`],
        {
          y: 0,
          duration: 1,
          delay: 1,
          stagger: 0.07,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        `.${styles.formSection}`,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, delay: 1.2, ease: "power3.out" }
      );
    },
    { scope: container }
  );

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        // Newer API returns a reference id; fall back to a plain toast if a
        // stale deployment omits it so the success flow never breaks.
        const ref = data?.data?.ticketId || null;
        setForm({ name: "", email: "", phone: "", address: "", subject: "", message: "" });
        if (ref) {
          setTicketId(ref);
        } else {
          toast.success("Message sent! We'll get back to you soon.");
        }
      } else {
        toast.error(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(ticketId);
      toast.success("Reference number copied.");
    } catch {
      toast.error("Couldn't copy. Please copy it manually.");
    }
  };

  const handleSendAnother = () => {
    setTicketId(null);
  };

  return (
    <div className={`${styles.contactPage} website-gutter`} ref={container}>

      {/* 1. Heading */}
      <div className={styles.headingSection}>
        <div className={styles.container}>
          <div className={styles.headingSpacer} />
          <div className={styles.headingRight}>
            <div className={styles.contactHeading}>
              <h1 className="font-header">Contact</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Form */}
      <div className={styles.formSection}>
        <div className={styles.formInner}>

          <div className={styles.formHeader}>
            <p className={styles.formEyebrow}>{ticketId ? "Message sent" : "Send a message"}</p>
            <div className={styles.divider} />
          </div>

          {ticketId ? (
            <div className={styles.successPanel} role="status" aria-live="polite">
              <h2 className={styles.successTitle}>Thanks — we've received your message.</h2>
              <p className={styles.successText}>
                Our team will get back to you soon. We've also emailed you a copy.
                Please keep your reference number for any follow-up.
              </p>

              <div className={styles.refBox}>
                <div className={styles.refMeta}>
                  <p className={styles.refLabel}>Reference number</p>
                  <p className={styles.refValue}>{ticketId}</p>
                </div>
                <button type="button" onClick={handleCopyRef} className={styles.copyBtn}>
                  Copy
                </button>
              </div>

              <button type="button" onClick={handleSendAnother} className={styles.resetBtn}>
                Send another message
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>Mobile Number</label>
                <PhoneInput
                  native
                  id="phone"
                  name="phone"
                  required
                  placeholder="98765 43210"
                  value={form.phone}
                  onChange={(val) => setForm((prev) => ({ ...prev, phone: val }))}
                  className={styles.input}
                  codeOffset="0"
                  inputOffset="3.75rem"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="address" className={styles.label}>
                  Address <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  autoComplete="street-address"
                  placeholder="City, State"
                  value={form.address}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="subject" className={styles.label}>
                Subject <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                placeholder="What's this about?"
                value={form.subject}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.label}>Message</label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                placeholder="Write your message here..."
                value={form.message}
                onChange={handleChange}
                className={`${styles.input} ${styles.textarea}`}
              />
            </div>

            <div className={styles.formFooter}>
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className={styles.submitBtn}
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
          )}

        </div>
      </div>

      {/* 3. Details */}
      <div className={styles.infoSection}>
        <div className={styles.container}>

          {/* Left column */}
          <div className={styles.col}>
            <div>
              <div className={styles.sectionLabel}><p>Where</p></div>
              <div className={styles.divider} />
              <div className={styles.item}><p>Energyflow</p></div>
              <div className={styles.item}><p>Pune, Maharashtra</p></div>
              <div className={styles.item}><p>411047</p></div>
            </div>

            <div>
              <div className={styles.sectionLabel}><p>Mail</p></div>
              <div className={styles.divider} />
              <div className={styles.item}>
                <a href="mailto:energyflow.official@gmail.com">energyflow.official@gmail.com</a>
              </div>
            </div>

          </div>

          {/* Right column */}
          <div className={styles.col}>
            <div>
              <div className={styles.sectionLabel}><p>Socials</p></div>
              <div className={styles.divider} />
              <div className={styles.item}>
                <a href="https://www.instagram.com/mom.stitched" target="_blank" rel="noreferrer">Instagram</a>
              </div>
              <div className={styles.item}>
                <a href="https://www.facebook.com/profile.php?id=100087738263074" target="_blank" rel="noreferrer">Facebook</a>
              </div>
              <div className={styles.item}>
                <a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default ContactPage;
