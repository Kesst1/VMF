
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-white">
      <h1 className="mb-3 text-4xl font-bold">
        Privacy Policy
      </h1>

      <p className="mb-8 text-sm text-gray-400">
        Last updated: November 10, 2026
      </p>

      <section className="space-y-6">
        <div>
          <h2 className="mb-2 text-xl font-semibold">
            1. Introduction
          </h2>
          <p>
            VMF respects your privacy. This Privacy Policy explains
            how VMF BOT and the VMF website collect, use, and store
            information when users connect their Roblox accounts
            through Roblox OAuth.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            2. Information We Collect
          </h2>
          <p>
            When you use our verification system, we may collect
            your Roblox user ID, Roblox username, Discord user ID,
            and account verification status.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            3. How We Use Information
          </h2>
          <p>
            Information is used to link Roblox accounts with
            Discord accounts, verify membership, prevent duplicate
            registrations, and operate VMF services.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            4. Roblox OAuth
          </h2>
          <p>
            VMF uses Roblox OAuth to authenticate users. We do not
            ask users to provide their Roblox passwords. Users
            authorize access through Roblox's official
            authorization page.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            5. Data Sharing
          </h2>
          <p>
            We do not sell personal information. Information may
            be processed by service providers required to operate
            VMF, such as database and hosting providers.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            6. Data Retention and Deletion
          </h2>
          <p>
            Verification information is retained while needed to
            operate the service. Users may contact the VMF team
            to request access to or deletion of their verification
            information, subject to applicable requirements.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            7. Contact
          </h2>
          <p>
            For privacy questions or data requests, contact the
            VMF team through its official Discord server.
          </p>
        </div>
      </section>
    </main>
  );
}
