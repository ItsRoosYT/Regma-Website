// Built-in Regma IT open positions (imported batch).
// These render on the careers page automatically. Positions added by an
// admin in the dashboard are merged in and take precedence by title.
const SEED_JOBS = [
  {
    "title": "Testingenjör med fordonserfarenhet",
    "department": "Testing & Verification",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A testing & verification consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Maintenance Engineer - Mechanical",
    "department": "Engineering",
    "type": "Consulting assignment",
    "location": "Skövde",
    "summary": "An engineering consulting assignment based in Skövde. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "System Design Leader",
    "department": "Design",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A design consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Senior Digital Product Designer",
    "department": "Design",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A design consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Chief Exterior Designer Concept & Vehicle Architecture",
    "department": "Design",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A design consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Developer - Senior Professional 1",
    "department": "Software & IT",
    "type": "Consulting assignment",
    "location": "Södertälje",
    "summary": "A software & it consulting assignment based in Södertälje. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Agile Flow Leader - Senior Professional 1",
    "department": "Management & Ops",
    "type": "Consulting assignment",
    "location": "Södertälje",
    "summary": "A management & ops consulting assignment based in Södertälje. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "IT Service Manager - Senior Professional 1",
    "department": "Software & IT",
    "type": "Consulting assignment",
    "location": "Södertälje",
    "summary": "A software & it consulting assignment based in Södertälje. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Product Quality Assurance / Manager — Lead",
    "department": "Management & Ops",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A management & ops consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "System Verification Engineer — Senior Expert",
    "department": "Testing & Verification",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A testing & verification consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "HW Electrical & Electronics Engineer — Senior",
    "department": "Engineering",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "An engineering consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Maintenance Engineer — Senior",
    "department": "Engineering",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "An engineering consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Production Capacity Planner — Lead",
    "department": "Management & Ops",
    "type": "Consulting assignment",
    "location": "Köping",
    "summary": "A management & ops consulting assignment based in Köping. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Strategic Buyer — Senior",
    "department": "Purchasing",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A purchasing consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Test Rig Maintenance Technician — Specialist",
    "department": "Testing & Verification",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A testing & verification consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Feature Leader — Specialist",
    "department": "Management & Ops",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A management & ops consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Mechanical Engineer — Senior Expert",
    "department": "Engineering",
    "type": "Consulting assignment",
    "location": "Umeå",
    "summary": "An engineering consulting assignment based in Umeå. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Embedded Software Integration Engineer — Specialist",
    "department": "Software & IT",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A software & it consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Embedded Software Application Engineer — Specialist",
    "department": "Software & IT",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A software & it consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "UX Designer — Senior",
    "department": "Design",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A design consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Price Analyst — Professional",
    "department": "Finance",
    "type": "Consulting assignment",
    "location": "Eskilstuna",
    "summary": "A finance consulting assignment based in Eskilstuna. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "System Design Engineer — Senior Expert",
    "department": "Design",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A design consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "UX Designer — Expert",
    "department": "Design",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A design consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "System Verification Engineer — Expert",
    "department": "Testing & Verification",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A testing & verification consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Industrialization Project Manager — Lead",
    "department": "Management & Ops",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A management & ops consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "System Design Engineer — Expert",
    "department": "Design",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A design consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Product Development Project Manager — Lead",
    "department": "Management & Ops",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A management & ops consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Manufacturing Product Preparation Engineer — Senior",
    "department": "Engineering",
    "type": "Consulting assignment",
    "location": "Köping",
    "summary": "An engineering consulting assignment based in Köping. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Tax Strategy & Policy — Lead",
    "department": "Finance",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A finance consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Test Engineer — Experienced",
    "department": "Testing & Verification",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A testing & verification consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Hardware Verification Engineer — Senior",
    "department": "Testing & Verification",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A testing & verification consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Business Solution Engineer — Senior Expert",
    "department": "Software & IT",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A software & it consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Manufacturing Engineer — Professional",
    "department": "Engineering",
    "type": "Consulting assignment",
    "location": "Skövde",
    "summary": "An engineering consulting assignment based in Skövde. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Maintenance Engineer — Professional",
    "department": "Engineering",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "An engineering consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Adaptation Engineer — Entry",
    "department": "Engineering",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "An engineering consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Business Controller/Financial Analyst — Professional",
    "department": "Finance",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A finance consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Test Engineer — Specialist",
    "department": "Testing & Verification",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A testing & verification consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Test Engineer — Senior",
    "department": "Testing & Verification",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A testing & verification consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Operational Buyer — Associate",
    "department": "Purchasing",
    "type": "Consulting assignment",
    "location": "Arvika",
    "summary": "A purchasing consulting assignment based in Arvika. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Adaptation Engineer — Lead",
    "department": "Management & Ops",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A management & ops consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Technical Customer Support — Professional",
    "department": "Management & Ops",
    "type": "Consulting assignment",
    "location": "Eskilstuna",
    "summary": "A management & ops consulting assignment based in Eskilstuna. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Business Consultant — Senior",
    "department": "Software & IT",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A software & it consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Service Designer — Senior Expert",
    "department": "Design",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A design consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Embedded Software Application Engineer — Expert",
    "department": "Software & IT",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A software & it consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Packaging Engineer — Senior",
    "department": "Engineering",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "An engineering consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Marketing Management Manager — Senior",
    "department": "Management & Ops",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A management & ops consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Logistics Engineer — Professional",
    "department": "Engineering",
    "type": "Consulting assignment",
    "location": "Skövde",
    "summary": "An engineering consulting assignment based in Skövde. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Accountant Clerk — Professional",
    "department": "Finance",
    "type": "Consulting assignment",
    "location": "Gothenburg",
    "summary": "A finance consulting assignment based in Gothenburg. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  },
  {
    "title": "Learning Delivery — Lead",
    "department": "Management & Ops",
    "type": "Consulting assignment",
    "location": "Eskilstuna",
    "summary": "A management & ops consulting assignment based in Eskilstuna. Apply to receive the full role description, responsibilities, and requirements — or get in touch to learn more."
  }
];
