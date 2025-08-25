import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F8F7F4",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          backgroundColor: "#FFFFFF",
          padding: "48px",
          borderRadius: "12px",
          border: "1px solid #E9DED5",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#666",
              textDecoration: "none",
              fontSize: "14px",
              marginBottom: "24px",
            }}
          >
            ← Back to Home
          </Link>
          
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "600",
              color: "#9F513A",
              margin: "0 0 16px 0",
            }}
          >
            Pointfour Privacy Policy
          </h1>
          
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
            <strong>Effective Date:</strong> August 25, 2025
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            <strong>Last Updated:</strong> August 25, 2025
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            fontSize: "16px",
            lineHeight: "1.6",
            color: "#333",
          }}
        >
          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Introduction
            </h2>
            <p style={{ marginBottom: "16px" }}>
              Pointfour ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how our browser extension collects, uses, and protects your information when you use our fit and review analysis service.
            </p>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Information We Collect
            </h2>
            
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "12px",
                marginTop: "24px",
              }}
            >
              Automatically Collected Information
            </h3>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>
                <strong>Page URLs:</strong> We detect when you visit supported fashion websites to display our widget
              </li>
              <li style={{ marginBottom: "8px" }}>
                <strong>Product Information:</strong> Product names, SKUs, and identifiers from pages you view to provide relevant fit analysis
              </li>
              <li style={{ marginBottom: "8px" }}>
                <strong>Browser Type and Version:</strong> For compatibility and troubleshooting purposes
              </li>
              <li style={{ marginBottom: "8px" }}>
                <strong>Extension Usage Data:</strong> Widget interactions, feature usage, and performance metrics
              </li>
            </ul>

            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "12px",
                marginTop: "24px",
              }}
            >
              Information We Do NOT Collect
            </h3>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>Personal identification information (name, email, address)</li>
              <li style={{ marginBottom: "8px" }}>Payment or credit card information</li>
              <li style={{ marginBottom: "8px" }}>Complete browsing history</li>
              <li style={{ marginBottom: "8px" }}>Information from non-fashion websites</li>
              <li style={{ marginBottom: "8px" }}>Passwords or login credentials</li>
            </ul>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              How We Use Your Information
            </h2>
            <p style={{ marginBottom: "12px" }}>We use the collected information to:</p>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>Display relevant fit and sizing information for products you're viewing</li>
              <li style={{ marginBottom: "8px" }}>Provide aggregated review summaries and quality insights</li>
              <li style={{ marginBottom: "8px" }}>Improve our fit prediction algorithms</li>
              <li style={{ marginBottom: "8px" }}>Enhance extension performance and fix bugs</li>
              <li style={{ marginBottom: "8px" }}>Develop new features based on usage patterns</li>
            </ul>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Data Storage and Security
            </h2>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>All data is transmitted using encrypted connections (HTTPS)</li>
              <li style={{ marginBottom: "8px" }}>We retain anonymized usage data for service improvement</li>
              <li style={{ marginBottom: "8px" }}>Product viewing data is processed in real-time and not permanently stored with user identifiers</li>
              <li style={{ marginBottom: "8px" }}>We implement industry-standard security measures to protect against unauthorized access</li>
            </ul>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Third-Party Services
            </h2>
            <p style={{ marginBottom: "12px" }}>Our extension may interact with:</p>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>Fashion retailer websites (to identify products and retrieve public review data)</li>
              <li style={{ marginBottom: "8px" }}>Our secure servers (to fetch fit analysis and review summaries)</li>
              <li style={{ marginBottom: "8px" }}>Analytics services (anonymous usage statistics only)</li>
            </ul>
            <p style={{ marginBottom: "16px" }}>
              We do not sell, trade, or transfer your information to third parties for marketing purposes.
            </p>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Your Rights and Choices
            </h2>
            <p style={{ marginBottom: "12px" }}>You can:</p>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>Disable the extension at any time through your browser settings</li>
              <li style={{ marginBottom: "8px" }}>Control permissions through your browser's extension management</li>
              <li style={{ marginBottom: "8px" }}>Request data deletion by contacting us at <a href="mailto:privacy@jessmahendra.com" style={{ color: "#9F513A" }}>privacy@jessmahendra.com</a></li>
            </ul>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Data Retention
            </h2>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>Session data is cleared when you close your browser</li>
              <li style={{ marginBottom: "8px" }}>Anonymized analytics data may be retained for up to 12 months</li>
              <li style={{ marginBottom: "8px" }}>We do not maintain user profiles or track users across sessions</li>
            </ul>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Children's Privacy
            </h2>
            <p style={{ marginBottom: "16px" }}>
              Our service is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.
            </p>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              International Data Transfers
            </h2>
            <p style={{ marginBottom: "16px" }}>
              If you use our extension outside the United States, your information may be transferred to and processed in the United States where our servers are located.
            </p>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Changes to This Policy
            </h2>
            <p style={{ marginBottom: "12px" }}>We may update this Privacy Policy periodically. We will notify users of material changes through:</p>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>Extension update notes</li>
              <li style={{ marginBottom: "8px" }}>In-extension notifications</li>
              <li style={{ marginBottom: "8px" }}>Updates to the "Last Updated" date above</li>
            </ul>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Contact Information
            </h2>
            <p style={{ marginBottom: "16px" }}>
              For questions, concerns, or requests regarding this Privacy Policy, please contact us at:
            </p>
            <ul style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              <li style={{ marginBottom: "8px" }}>
                <strong>Email:</strong> <a href="mailto:privacy@jessmahendra.com" style={{ color: "#9F513A" }}>privacy@jessmahendra.com</a>
              </li>
              <li style={{ marginBottom: "8px" }}>
                <strong>Website:</strong> <a href="https://pointfour.in" style={{ color: "#9F513A" }}>https://pointfour.in</a>
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              California Privacy Rights
            </h2>
            <p style={{ marginBottom: "16px" }}>
              California residents may have additional rights under the California Consumer Privacy Act (CCPA). To exercise these rights, please contact us using the information above.
            </p>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              European Privacy Rights
            </h2>
            <p style={{ marginBottom: "16px" }}>
              If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR) including access, rectification, erasure, and data portability. To exercise these rights, contact us at <a href="mailto:privacy@jessmahendra.com" style={{ color: "#9F513A" }}>privacy@jessmahendra.com</a>.
            </p>
          </section>

          <section style={{ marginBottom: "32px" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#333",
                marginBottom: "16px",
              }}
            >
              Consent
            </h2>
            <p style={{ marginBottom: "16px" }}>
              By using the Pointfour browser extension, you consent to our Privacy Policy and agree to its terms.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "48px",
            paddingTop: "24px",
            borderTop: "1px solid #E9DED5",
            textAlign: "center",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#6C6A68",
              color: "#FFFFFF",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}