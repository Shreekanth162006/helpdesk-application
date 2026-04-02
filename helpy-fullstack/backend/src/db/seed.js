import 'dotenv/config';
import { sequelize } from './sequelize.js';
import './models/index.js';
import { User, Forum, Category, Doc } from './models/index.js';

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  // Create default Super Admin
  const defaultSAEmail = process.env.DEFAULT_SA_EMAIL || 'admin@helpy.local';
  const defaultSAPassword = process.env.DEFAULT_SA_PASSWORD || 'admin123';
  const defaultSA = await User.findOne({ where: { email: defaultSAEmail } });
  if (!defaultSA) {
    await User.create({
      email: defaultSAEmail,
      password: defaultSAPassword,
      name: 'Super Admin',
      role: 'Super Admin',
    });
    console.log(`✅ Created default Super Admin: ${defaultSAEmail} / ${defaultSAPassword}`);
  } else {
    console.log(`ℹ️  Default Super Admin already exists: ${defaultSAEmail}`);
  }

  const forumCount = await Forum.count();
  if (forumCount === 0) {
    await Forum.create({
      name: 'Private Tickets',
      description: 'Support tickets (private)',
      private: true,
    });
    await Forum.create({
      name: 'Community',
      description: 'Public discussions',
      private: false,
      allowTopicVoting: true,
      allowPostVoting: true,
    });
    console.log('Created default forums');
  }

  // Ensure categories exist
  const [gs] = await Category.findOrCreate({ where: { name: 'Getting Started' }, defaults: { rank: 0, active: true } });
  const [faq] = await Category.findOrCreate({ where: { name: 'FAQ' }, defaults: { rank: 1, active: true } });
  const [troubleshoot] = await Category.findOrCreate({ where: { name: 'Troubleshooting' }, defaults: { rank: 2, active: true } });
  const [security] = await Category.findOrCreate({ where: { name: 'Security & Privacy' }, defaults: { rank: 3, active: true } });

  const adminId = defaultSA ? defaultSA.id : 1;

  // Seed Docs if they don't exist
  const docsToSeed = [
    {
      title: 'How to Create a Ticket',
      body: 'To create a support ticket, simply click on the "Create Ticket" button on your dashboard. Fill in the subject, category, and a detailed description of your issue. You can also attach files if needed.',
      categoryId: gs.id,
      userId: adminId,
      active: true,
    },
    {
      title: 'Understanding SLA Response Times',
      body: 'Our support team adheres to Service Level Agreements (SLA). Critical tickets are prioritized and usually addressed within 4 hours. General inquiries may take up to 24-48 hours.',
      categoryId: gs.id,
      userId: adminId,
      active: true,
    },
    {
      title: 'How do I reset my password?',
      body: 'Click on the "Forgot Password" link on the login page. Enter your registered email address and wait for a Super Admin to approve your reset request. Once approved, you will be able to set a new password.',
      categoryId: faq.id,
      userId: adminId,
      active: true,
    },
    {
      title: 'Can I cancel my own ticket?',
      body: 'Yes, if you no longer require assistance, you can open your ticket and click the "Cancel Ticket" button. This will notify our agents that the issue is no longer active.',
      categoryId: faq.id,
      userId: adminId,
      active: true,
    },
    {
      title: 'Why am I not receiving notifications?',
      body: 'Please check your notification settings and ensure that your browser allows desktop notifications for our site. Also, check your email spam folder if you have email alerts enabled.',
      categoryId: troubleshoot.id,
      userId: adminId,
      active: true,
    },
    {
      title: 'How to secure your account',
      body: 'We recommend using a strong, unique password for your Helpy account. Never share your credentials with anyone, and always log out when using a public computer.',
      categoryId: security.id,
      userId: adminId,
      active: true,
    }
  ];

  for (const d of docsToSeed) {
    const [doc, created] = await Doc.findOrCreate({
      where: { title: d.title },
      defaults: d
    });
    if (created) console.log(`✅ Created article: ${d.title}`);
  }

  console.log('Seed done.');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
