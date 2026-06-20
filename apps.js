/**
 * apps.js — Application Registry
 *
 * ADD YOUR APPS HERE.
 * Each entry = one card on the portal.
 *
 * Fields:
 *   id         {string}  Unique identifier
 *   name       {string}  Display name
 *   desc       {string}  Short description (shown on card and modal)
 *   url        {string}  Full URL to the app (opens in new tab)
 *   icon       {string}  Emoji or single character used as icon
 *   iconBg     {string}  CSS background for the icon tile (gradient or colour)
 *   iconColor  {string}  CSS colour for the icon text (if emoji, can be omitted)
 *   accent     {string}  Top-border accent colour for the card
 *   category   {string}  Category label (used in sidebar filter)
 *   catBg      {string}  Badge background colour
 *   catColor   {string}  Badge text colour
 *   status     {'online'|'offline'|'maintenance'}
 */

const APPS = [
  {
    id: "erp",
    name: "ERP System",
    desc: "Enterprise resource planning — manage orders, inventory, finance, and operations in one place.",
    url: "https://erp.yourdomain.com",
    icon: "🏭",
    iconBg: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
    accent: "#1a56db",
    category: "Operations",
    catBg: "#dbeafe",
    catColor: "#1e40af",
    status: "online"
  },
  {
    id: "crm",
    name: "CRM Portal",
    desc: "Customer relationship management — track leads, contacts, deals, and customer interactions.",
    url: "https://crm.yourdomain.com",
    icon: "🤝",
    iconBg: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
    accent: "#16a34a",
    category: "Sales",
    catBg: "#d1fae5",
    catColor: "#15803d",
    status: "online"
  },
  {
    id: "hr",
    name: "HR Management",
    desc: "Human resources portal — attendance, payroll, leave management, and employee records.",
    url: "https://hr.yourdomain.com",
    icon: "👥",
    iconBg: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
    accent: "#db2777",
    category: "HR",
    catBg: "#fce7f3",
    catColor: "#9d174d",
    status: "online"
  },
  {
    id: "inventory",
    name: "Inventory Manager",
    desc: "Real-time stock tracking, warehouse management, and supply chain visibility.",
    url: "https://inventory.yourdomain.com",
    icon: "📦",
    iconBg: "linear-gradient(135deg, #fef9c3, #fde68a)",
    accent: "#d97706",
    category: "Operations",
    catBg: "#fef3c7",
    catColor: "#92400e",
    status: "online"
  },
  {
    id: "accounts",
    name: "Accounts & Finance",
    desc: "GST invoicing, expense tracking, financial reports, and bank reconciliation.",
    url: "https://accounts.yourdomain.com",
    icon: "💰",
    iconBg: "linear-gradient(135deg, #d1fae5, #6ee7b7)",
    accent: "#059669",
    category: "Finance",
    catBg: "#d1fae5",
    catColor: "#065f46",
    status: "online"
  },
  {
    id: "reports",
    name: "Work Report App",
    desc: "Generate professional daily, weekly, and monthly work reports for Laser Expert India.",
    url: "https://reports.leip.co.in",
    icon: "📊",
    iconBg: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
    accent: "#7c3aed",
    category: "Analytics",
    catBg: "#ede9fe",
    catColor: "#5b21b6",
    status: "online"
  },
  {
    id: "laser-ops",
    name: "Laser Operations",
    desc: "Laser job scheduling, machine monitoring, and production workflow for laser cutting/engraving.",
    url: "https://laserops.yourdomain.com",
    icon: "⚡",
    iconBg: "linear-gradient(135deg, #fff7ed, #fed7aa)",
    accent: "#f97316",
    category: "Production",
    catBg: "#ffedd5",
    catColor: "#9a3412",
    status: "online"
  },
  {
    id: "support",
    name: "Support Ticketing",
    desc: "Internal and customer support ticket management with SLA tracking and escalation.",
    url: "https://support.yourdomain.com",
    icon: "🎫",
    iconBg: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
    accent: "#4f46e5",
    category: "Support",
    catBg: "#e0e7ff",
    catColor: "#3730a3",
    status: "maintenance"
  },
  {
    id: "docs",
    name: "Document Manager",
    desc: "Centralized document storage, sharing, version control, and approval workflows.",
    url: "https://docs.yourdomain.com",
    icon: "📄",
    iconBg: "linear-gradient(135deg, #f0fdf4, #bbf7d0)",
    accent: "#22c55e",
    category: "Productivity",
    catBg: "#dcfce7",
    catColor: "#14532d",
    status: "online"
  },
  {
    id: "email",
    name: "Webmail",
    desc: "Company email client — manage business correspondence, calendars, and contacts.",
    url: "https://mail.yourdomain.com",
    icon: "✉️",
    iconBg: "linear-gradient(135deg, #f0f9ff, #bae6fd)",
    accent: "#0284c7",
    category: "Productivity",
    catBg: "#e0f2fe",
    catColor: "#0c4a6e",
    status: "online"
  },
  {
    id: "purchase",
    name: "Purchase Orders",
    desc: "Vendor management, purchase requisitions, PO approvals, and procurement tracking.",
    url: "https://purchase.yourdomain.com",
    icon: "🛒",
    iconBg: "linear-gradient(135deg, #fdf2f8, #f5d0fe)",
    accent: "#a21caf",
    category: "Operations",
    catBg: "#fdf4ff",
    catColor: "#701a75",
    status: "offline"
  },
  {
    id: "quality",
    name: "Quality Control",
    desc: "Inspection checklists, defect tracking, quality reports, and compliance management.",
    url: "https://quality.yourdomain.com",
    icon: "✅",
    iconBg: "linear-gradient(135deg, #f0fdf4, #86efac)",
    accent: "#15803d",
    category: "Production",
    catBg: "#dcfce7",
    catColor: "#14532d",
    status: "online"
  }
];
