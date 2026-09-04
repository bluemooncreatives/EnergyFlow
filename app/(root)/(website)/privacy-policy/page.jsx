import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import Link from 'next/link'

const breadcrumb = {
    title: 'Privacy Policy',
    links: [
        { label: 'Privacy Policy' },
    ]
}

const Section = ({ number, title, children }) => (
    <div className='mt-10'>
        <h2 className='text-lg lg:text-xl font-semibold text-[var(--dark-red-2)] mb-3'>
            {number}. {title}
        </h2>
        <div className='space-y-3 text-base lg:text-[17px] leading-relaxed text-gray-700'>
            {children}
        </div>
    </div>
)

const PrivacyPolicy = () => {
    return (
        <div>
            <WebsiteBreadcrumb props={breadcrumb} />
            <div className='website-gutter py-16 max-w-[1400px] mx-auto'>

                {/* Header */}
                <div className='border-b border-gray-200 pb-8'>
                    <h1 className='text-3xl lg:text-4xl font-semibold mb-2'>Privacy Policy</h1>
                    <p className='text-sm text-gray-500'>Last Updated: June 20, 2025 &nbsp;|&nbsp; Effective Date: June 20, 2025</p>
                    <p className='mt-5 text-base lg:text-[17px] leading-relaxed text-gray-700'>
                        At <strong>Energyflow</strong>, we are committed to protecting your privacy and handling your personal data with transparency,
                        integrity, and care. This Privacy Policy explains what information we collect, how we use it, who we share it with,
                        and the rights you have over your data.
                    </p>
                    <p className='mt-3 text-base lg:text-[17px] leading-relaxed text-gray-700'>
                        By visiting <strong>energyflow.com</strong> (the &quot;Website&quot;) or placing an order with us, you acknowledge
                        that you have read and understood this Privacy Policy. If you do not agree, please discontinue use of the Website.
                    </p>
                    <p className='mt-3 text-base lg:text-[17px] leading-relaxed text-gray-700'>
                        This Policy applies to all users of the Website worldwide and complies with applicable data protection laws including the
                        <strong> GDPR</strong> (EU/EEA), <strong>UK GDPR</strong>, <strong>CCPA</strong> (California, USA),
                        <strong> India DPDP Act 2023</strong>, and <strong>Australian Privacy Act 1988</strong>.
                    </p>
                </div>

                {/* Section 1 */}
                <Section number="1" title="Data Controller Information">
                    <p>
                        The data controller responsible for your personal information is:<br /><br />
                        <strong>Business Name:</strong> Energyflow<br />
                        <strong>Registered Address:</strong> Pune, Maharashtra 411047<br />
                        <strong>Email:</strong>{' '}
                        <a href="mailto:energyflow.official@gmail.com" className='text-[var(--dark-red-2)] underline underline-offset-2'>
                            energyflow.official@gmail.com
                        </a><br />
                        <strong>Phone:</strong>{' '}
                        <a href="tel:+918237284906" className='text-[var(--dark-red-2)] underline underline-offset-2'>
                            +91 82372 84906
                        </a>
                    </p>
                    <p>
                        For all privacy-related queries, including data access or deletion requests, please contact us at the email above.
                    </p>
                </Section>

                {/* Section 2 */}
                <Section number="2" title="Information We Collect">
                    <p>We collect the following categories of personal information:</p>

                    <p className='font-medium text-gray-800 mt-2'>a) Information You Provide Directly</p>
                    <ul className='list-disc ps-6 space-y-2'>
                        <li><strong>Identity Data:</strong> Full name, username, or similar identifiers.</li>
                        <li><strong>Contact Data:</strong> Email address, phone number, billing address, and shipping address.</li>
                        <li><strong>Account Data:</strong> Username, password (stored in encrypted form), and account preferences.</li>
                        <li><strong>Order Data:</strong> Products purchased, order history, and transaction records.</li>
                        <li><strong>Payment Data:</strong> Card type and last four digits (we do not store full card numbers; payments are processed by PCI-DSS compliant gateways).</li>
                        <li><strong>Communications:</strong> Messages, inquiries, or feedback you send us via contact forms, email, or chat.</li>
                    </ul>

                    <p className='font-medium text-gray-800 mt-4'>b) Information Collected Automatically</p>
                    <ul className='list-disc ps-6 space-y-2'>
                        <li><strong>Technical Data:</strong> IP address, browser type and version, operating system, device identifiers, and time zone.</li>
                        <li><strong>Usage Data:</strong> Pages visited, referring URLs, time spent on pages, links clicked, and browsing behavior on the Website.</li>
                        <li><strong>Cookie Data:</strong> Data collected through cookies and similar tracking technologies (see Section 5).</li>
                    </ul>

                    <p className='font-medium text-gray-800 mt-4'>c) Information from Third Parties</p>
                    <ul className='list-disc ps-6 space-y-2'>
                        <li>Analytics providers (e.g., Google Analytics) may share aggregated behavioral data about Website visitors.</li>
                        <li>Payment processors may share transaction status and fraud-detection signals.</li>
                        <li>Social media platforms if you connect your account or interact with our social content.</li>
                    </ul>
                </Section>

                {/* Section 3 */}
                <Section number="3" title="How We Use Your Information">
                    <p>We use your personal data for the following purposes:</p>
                    <ul className='list-disc ps-6 space-y-2'>
                        <li><strong>Order Fulfillment:</strong> Processing, packaging, and delivering your orders; sending order confirmation, dispatch, and delivery notifications.</li>
                        <li><strong>Account Management:</strong> Creating and maintaining your account; verifying your identity.</li>
                        <li><strong>Customer Support:</strong> Responding to queries, complaints, and return/refund requests.</li>
                        <li><strong>Payments & Fraud Prevention:</strong> Verifying payment details and detecting, preventing, or investigating fraudulent transactions.</li>
                        <li><strong>Marketing Communications:</strong> Sending promotional emails, special offers, and newsletters — only with your consent or where permitted by law. You may opt out at any time via the unsubscribe link in emails.</li>
                        <li><strong>Website Improvement:</strong> Analyzing usage patterns to improve site performance, design, and product offerings.</li>
                        <li><strong>Legal Compliance:</strong> Meeting our obligations under applicable laws, regulations, court orders, or governmental requests.</li>
                        <li><strong>Personalization:</strong> Displaying relevant products, recommendations, and content based on your browsing and purchase history.</li>
                    </ul>
                </Section>

                {/* Section 4 */}
                <Section number="4" title="Legal Basis for Processing (GDPR)">
                    <p>If you are located in the EU/EEA or UK, we process your personal data under the following legal bases:</p>
                    <ul className='list-disc ps-6 space-y-2'>
                        <li><strong>Contract Performance:</strong> Processing necessary to fulfill your orders and manage your account (Article 6(1)(b) GDPR).</li>
                        <li><strong>Legitimate Interests:</strong> Fraud prevention, website security, and improving our services, where these do not override your fundamental rights (Article 6(1)(f) GDPR).</li>
                        <li><strong>Consent:</strong> Marketing emails and non-essential cookies — where you have given explicit consent (Article 6(1)(a) GDPR). You may withdraw consent at any time.</li>
                        <li><strong>Legal Obligation:</strong> Retaining financial records and complying with applicable laws (Article 6(1)(c) GDPR).</li>
                    </ul>
                </Section>

                {/* Section 5 */}
                <Section number="5" title="Cookies & Tracking Technologies">
                    <p>We use cookies and similar technologies to enhance your experience on the Website. These include:</p>
                    <ul className='list-disc ps-6 space-y-2'>
                        <li><strong>Essential Cookies:</strong> Required for the Website to function correctly (e.g., shopping cart, login sessions). These cannot be disabled.</li>
                        <li><strong>Analytics Cookies:</strong> Used to understand how visitors interact with the Website (e.g., Google Analytics). Data is anonymized where possible.</li>
                        <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements and track the effectiveness of campaigns. Only activated with your consent.</li>
                        <li><strong>Preference Cookies:</strong> Remember your settings and preferences (e.g., language, currency) to personalize your experience.</li>
                    </ul>
                    <p>
                        You can manage or withdraw your cookie consent at any time through your browser settings or our cookie consent banner.
                        Disabling certain cookies may affect Website functionality. For more on how to control cookies, visit{' '}
                        <strong>www.allaboutcookies.org</strong>.
                    </p>
                </Section>

                {/* Section 6 */}
                <Section number="6" title="Sharing & Disclosure of Your Information">
                    <p>We do not sell, rent, or trade your personal information. We may share your data with trusted third parties only as follows:</p>
                    <ul className='list-disc ps-6 space-y-2'>
                        <li><strong>Delivery & Logistics Partners:</strong> To fulfill and ship your orders (name, address, phone number shared only as needed).</li>
                        <li><strong>Payment Processors:</strong> Secure, PCI-DSS compliant gateways to process transactions. They receive only the data necessary to complete payments.</li>
                        <li><strong>IT & Hosting Providers:</strong> Cloud and server infrastructure providers who support our Website operations, bound by strict data processing agreements.</li>
                        <li><strong>Marketing & Analytics Tools:</strong> Services like Google Analytics or email marketing platforms, used under data processing agreements and with appropriate safeguards.</li>
                        <li><strong>Legal & Regulatory Authorities:</strong> When required by law, court order, or to protect the rights, property, or safety of Energyflow, our customers, or the public.</li>
                        <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred to the successor entity, subject to the same privacy protections.</li>
                    </ul>
                    <p>All third-party service providers are contractually obligated to handle your data securely and in compliance with applicable data protection laws.</p>
                </Section>

                {/* Section 7 */}
                <Section number="7" title="International Data Transfers">
                    <ul className='list-disc ps-6 space-y-2'>
                        <li>Energyflow is based in India. If you access our Website from outside India, your data may be transferred to and processed in India or other countries where our service providers operate.</li>
                        <li>For transfers from the EU/EEA or UK, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission or the UK ICO to ensure adequate protection.</li>
                        <li>We take all reasonable steps to ensure that international transfers are protected by appropriate safeguards in accordance with applicable data protection law.</li>
                    </ul>
                </Section>

                {/* Section 8 */}
                <Section number="8" title="Data Retention">
                    <ul className='list-disc ps-6 space-y-2'>
                        <li>We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Policy, or as required by law.</li>
                        <li><strong>Order & Transaction Records:</strong> Retained for 7 years for tax and legal compliance (as required by Indian GST and Accounting laws).</li>
                        <li><strong>Account Data:</strong> Retained for the duration of your account plus 2 years after closure, unless you request earlier deletion.</li>
                        <li><strong>Marketing Data:</strong> Retained until you withdraw consent or unsubscribe.</li>
                        <li><strong>Analytics Data:</strong> Retained in anonymized/aggregated form for up to 26 months.</li>
                        <li>When data is no longer required, we securely delete or anonymize it.</li>
                    </ul>
                </Section>

                {/* Section 9 */}
                <Section number="9" title="Data Security">
                    <ul className='list-disc ps-6 space-y-2'>
                        <li>We implement industry-standard technical and organizational security measures to protect your personal data against unauthorized access, disclosure, alteration, or destruction.</li>
                        <li>These measures include SSL/TLS encryption for data in transit, encrypted storage for sensitive data at rest, access controls limited to authorized personnel, and regular security assessments.</li>
                        <li>Payment information is processed through PCI-DSS compliant gateways. We never store full card numbers on our servers.</li>
                        <li>While we take all reasonable precautions, no method of transmission over the internet is 100% secure. In the unlikely event of a data breach that affects your rights, we will notify you and the relevant authorities in accordance with applicable law (within 72 hours for GDPR, and as required by India&apos;s CERT-In rules).</li>
                    </ul>
                </Section>

                {/* Section 10 */}
                <Section number="10" title="Your Rights">

                    <p className='font-medium text-gray-800'>a) Rights for EU / EEA / UK Users (GDPR & UK GDPR)</p>
                    <ul className='list-disc ps-6 space-y-2'>
                        <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you.</li>
                        <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
                        <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your personal data where there is no compelling reason for its continued processing.</li>
                        <li><strong>Right to Restrict Processing:</strong> Request that we limit how we use your data in certain circumstances.</li>
                        <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
                        <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing purposes.</li>
                        <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for consent-based processing at any time, without affecting the lawfulness of prior processing.</li>
                        <li>You also have the right to lodge a complaint with your national data protection authority (e.g., ICO in the UK, or your EU supervisory authority).</li>
                    </ul>

                    <p className='font-medium text-gray-800 mt-4'>b) Rights for California Users (CCPA / CPRA)</p>
                    <ul className='list-disc ps-6 space-y-2'>
                        <li><strong>Right to Know:</strong> Request disclosure of the categories and specific pieces of personal information we have collected about you.</li>
                        <li><strong>Right to Delete:</strong> Request deletion of personal information we have collected, subject to certain exceptions.</li>
                        <li><strong>Right to Opt-Out of Sale:</strong> We do not sell personal information. You may still submit an opt-out request at <a href="mailto:energyflow.official@gmail.com" className='text-[var(--dark-red-2)] underline underline-offset-2'>energyflow.official@gmail.com</a>.</li>
                        <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</li>
                        <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information.</li>
                    </ul>

                    <p className='font-medium text-gray-800 mt-4'>c) Rights for Indian Users (DPDP Act 2023)</p>
                    <ul className='list-disc ps-6 space-y-2'>
                        <li><strong>Right to Access:</strong> Request a summary of personal data held and its processing activities.</li>
                        <li><strong>Right to Correction & Erasure:</strong> Request correction of inaccurate data or erasure of data no longer necessary for its original purpose.</li>
                        <li><strong>Right to Grievance Redressal:</strong> Submit grievances to our Data Protection Officer via <a href="mailto:energyflow.official@gmail.com" className='text-[var(--dark-red-2)] underline underline-offset-2'>energyflow.official@gmail.com</a>.</li>
                        <li><strong>Right to Nominate:</strong> Nominate another individual to exercise rights on your behalf in the event of death or incapacity.</li>
                    </ul>

                    <p className='font-medium text-gray-800 mt-4'>d) Rights for Australian Users (Privacy Act 1988)</p>
                    <ul className='list-disc ps-6 space-y-2'>
                        <li>You have the right to access personal information we hold about you and to request corrections to inaccurate information.</li>
                        <li>You may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) if you believe we have mishandled your data.</li>
                    </ul>

                    <p className='mt-3'>
                        To exercise any of the above rights, please contact us at{' '}
                        <a href="mailto:energyflow.official@gmail.com" className='text-[var(--dark-red-2)] underline underline-offset-2'>
                            energyflow.official@gmail.com
                        </a>{' '}
                        with the subject line <strong>&quot;Privacy Rights Request&quot;</strong>. We will respond within 30 days (or 72 hours for urgent GDPR requests).
                    </p>
                </Section>

                {/* Section 11 */}
                <Section number="11" title="Children's Privacy">
                    <ul className='list-disc ps-6 space-y-2'>
                        <li>Our Website is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13.</li>
                        <li>If we become aware that a child under 13 has provided us with personal data without verifiable parental consent, we will delete that information promptly.</li>
                        <li>If you are a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:energyflow.official@gmail.com" className='text-[var(--dark-red-2)] underline underline-offset-2'>energyflow.official@gmail.com</a>.</li>
                    </ul>
                </Section>

                {/* Section 12 */}
                <Section number="12" title="Third-Party Links">
                    <ul className='list-disc ps-6 space-y-2'>
                        <li>Our Website may contain links to third-party websites, social media platforms, or payment processors. These external sites have their own privacy policies, which we encourage you to review.</li>
                        <li>We are not responsible for the privacy practices or content of third-party sites. Clicking on third-party links is at your own discretion and risk.</li>
                    </ul>
                </Section>

                {/* Section 13 */}
                <Section number="13" title="Marketing Communications & Opt-Out">
                    <ul className='list-disc ps-6 space-y-2'>
                        <li>With your consent, we may send you promotional emails about new products, sales, and events.</li>
                        <li>You can unsubscribe from marketing emails at any time by clicking the &quot;Unsubscribe&quot; link in any email or by contacting us at <a href="mailto:energyflow.official@gmail.com" className='text-[var(--dark-red-2)] underline underline-offset-2'>energyflow.official@gmail.com</a>.</li>
                        <li>Opting out of marketing emails will not affect transactional emails related to your orders (e.g., order confirmation, shipping updates).</li>
                        <li>We comply with the CAN-SPAM Act (USA), CASL (Canada), and applicable Indian regulations on unsolicited commercial communications.</li>
                    </ul>
                </Section>

                {/* Section 14 */}
                <Section number="14" title="Changes to This Privacy Policy">
                    <ul className='list-disc ps-6 space-y-2'>
                        <li>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.</li>
                        <li>Any changes will be posted on this page with an updated &quot;Last Updated&quot; date. For material changes, we will notify registered users via email at least 14 days before the changes take effect.</li>
                        <li>Continued use of the Website after changes are posted constitutes your acceptance of the updated Policy.</li>
                    </ul>
                </Section>

                {/* Contact */}
                <div className='mt-12 border-t border-gray-200 pt-8'>
                    <h2 className='text-lg lg:text-xl font-semibold text-[var(--dark-red-2)] mb-3'>Contact Us & Grievance Redressal</h2>
                    <p className='text-base lg:text-[17px] leading-relaxed text-gray-700'>
                        For any questions, concerns, or requests related to this Privacy Policy or your personal data, please contact our Data Protection Officer:
                    </p>
                    <ul className='mt-4 space-y-2 text-base lg:text-[17px] text-gray-700'>
                        <li><strong>Email:</strong>{' '}
                            <a href="mailto:energyflow.official@gmail.com" className='text-[var(--dark-red-2)] underline underline-offset-2'>
                                energyflow.official@gmail.com
                            </a>
                        </li>
                        <li><strong>Phone:</strong>{' '}
                            <a href="tel:+918237284906" className='text-[var(--dark-red-2)] underline underline-offset-2'>
                                +91 82372 84906
                            </a>
                        </li>
                        <li><strong>Address:</strong> Energyflow, Pune, Maharashtra 411047</li>
                    </ul>
                    <p className='mt-4 text-base lg:text-[17px] leading-relaxed text-gray-700'>
                        You may also review our{' '}
                        <Link href="/terms-and-conditions" className='text-[var(--dark-red-2)] underline underline-offset-2'>
                            Terms &amp; Conditions
                        </Link>{' '}
                        for additional information on your rights and obligations when using our Website.
                    </p>
                    <p className='mt-6 text-sm text-gray-500'>
                        Thank you for trusting Energyflow. Your privacy is important to us and we are committed to safeguarding it.
                    </p>
                </div>

            </div>
        </div>
    )
}

export default PrivacyPolicy
