import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CISOLens database...");

  // ── FRAMEWORKS ──────────────────────────────────────────────────────────────
  const nist = await prisma.framework.upsert({
    where: { slug: "nist-csf-2" },
    update: {},
    create: {
      slug: "nist-csf-2",
      name: "NIST Cybersecurity Framework 2.0",
      shortName: "NIST CSF",
      version: "2.0",
      region: "Global",
      description: "NIST CSF 2.0 — Govern, Identify, Protect, Detect, Respond, Recover",
      domains: {
        create: [
          {
            code: "GV", name: "Govern", order: 1,
            controls: {
              create: [
                {
                  controlId: "GV.OC-01", order: 1,
                  title: "Cybersecurity Policy",
                  description: "Organizational cybersecurity policy is established and communicated",
                  questions: {
                    create: [{
                      order: 1,
                      text: "Does your organisation have a documented cybersecurity policy that is reviewed at least annually?",
                      helpText: "A cybersecurity policy defines the organisation's security objectives, roles, and expected behaviours.",
                      options: JSON.stringify([
                        { value: 3, label: "Yes — formally documented, approved by leadership, reviewed annually" },
                        { value: 2, label: "Yes — documented but not regularly reviewed" },
                        { value: 1, label: "Informal / undocumented guidelines only" },
                        { value: 0, label: "No policy exists" },
                      ]),
                    }],
                  },
                },
                {
                  controlId: "GV.RM-01", order: 2,
                  title: "Risk Management Strategy",
                  description: "Risk management objectives are established and agreed upon by stakeholders",
                  questions: {
                    create: [{
                      order: 1,
                      text: "Does your organisation have a formal risk management process for cybersecurity risks?",
                      options: JSON.stringify([
                        { value: 3, label: "Formal process — risk register, regular reviews, board reporting" },
                        { value: 2, label: "Partial process — some risks tracked but inconsistently" },
                        { value: 1, label: "Ad-hoc — risks addressed reactively only" },
                        { value: 0, label: "No risk management process" },
                      ]),
                    }],
                  },
                },
              ],
            },
          },
          {
            code: "ID", name: "Identify", order: 2,
            controls: {
              create: [
                {
                  controlId: "ID.AM-01", order: 1,
                  title: "Asset Inventory — Hardware",
                  description: "Inventories of hardware managed by the organization are maintained",
                  questions: {
                    create: [{
                      order: 1,
                      text: "Do you maintain an inventory of all hardware assets (servers, endpoints, network devices)?",
                      options: JSON.stringify([
                        { value: 3, label: "Complete automated inventory with regular reconciliation" },
                        { value: 2, label: "Partial inventory — major assets tracked" },
                        { value: 1, label: "Manual ad-hoc tracking" },
                        { value: 0, label: "No inventory maintained" },
                      ]),
                    }],
                  },
                },
                {
                  controlId: "ID.AM-02", order: 2,
                  title: "Asset Inventory — Software",
                  description: "Inventories of software managed by the organization are maintained",
                  questions: {
                    create: [{
                      order: 1,
                      text: "Is there a maintained inventory of all software and applications in use across your organisation?",
                      options: JSON.stringify([
                        { value: 3, label: "Full software inventory with version tracking and license management" },
                        { value: 2, label: "Core applications tracked, shadow IT not accounted for" },
                        { value: 1, label: "Partial — only some systems tracked" },
                        { value: 0, label: "No software inventory" },
                      ]),
                    }],
                  },
                },
              ],
            },
          },
          {
            code: "PR", name: "Protect", order: 3,
            controls: {
              create: [
                {
                  controlId: "PR.AC-01", order: 1,
                  title: "Identity Management & MFA",
                  description: "Identities and credentials for authorized users, services, and hardware are managed",
                  questions: {
                    create: [{
                      order: 1,
                      text: "Is multi-factor authentication (MFA) enforced for access to critical systems and privileged accounts?",
                      options: JSON.stringify([
                        { value: 3, label: "MFA enforced everywhere — all users, all systems" },
                        { value: 2, label: "MFA enforced on critical and privileged systems only" },
                        { value: 1, label: "MFA available but not consistently enforced" },
                        { value: 0, label: "No MFA deployed" },
                      ]),
                    }],
                  },
                },
                {
                  controlId: "PR.DS-01", order: 2,
                  title: "Data at Rest Protection",
                  description: "Data-at-rest is protected",
                  questions: {
                    create: [{
                      order: 1,
                      text: "Is sensitive data encrypted at rest across your storage systems and endpoints?",
                      options: JSON.stringify([
                        { value: 3, label: "All sensitive data encrypted at rest — verified and audited" },
                        { value: 2, label: "Encryption applied to most critical data stores" },
                        { value: 1, label: "Partial encryption — some systems only" },
                        { value: 0, label: "No data encryption at rest" },
                      ]),
                    }],
                  },
                },
              ],
            },
          },
          {
            code: "DE", name: "Detect", order: 4,
            controls: {
              create: [
                {
                  controlId: "DE.CM-01", order: 1,
                  title: "Continuous Security Monitoring",
                  description: "Networks and network services are monitored to find potentially adverse events",
                  questions: {
                    create: [{
                      order: 1,
                      text: "Do you have continuous monitoring for security events across your network and endpoints?",
                      options: JSON.stringify([
                        { value: 3, label: "24/7 SIEM with automated alerting and SOC coverage" },
                        { value: 2, label: "Business hours monitoring with alerting" },
                        { value: 1, label: "Log collection without real-time alerting" },
                        { value: 0, label: "No monitoring in place" },
                      ]),
                    }],
                  },
                },
              ],
            },
          },
          {
            code: "RS", name: "Respond", order: 5,
            controls: {
              create: [
                {
                  controlId: "RS.RP-01", order: 1,
                  title: "Incident Response Plan",
                  description: "The incident response plan is executed in coordination with relevant third parties",
                  questions: {
                    create: [{
                      order: 1,
                      text: "Does your organisation have a tested Incident Response Plan?",
                      options: JSON.stringify([
                        { value: 3, label: "IRP documented, tested via tabletop exercise within last 12 months" },
                        { value: 2, label: "IRP exists but has not been recently tested" },
                        { value: 1, label: "Draft IRP — never tested or rehearsed" },
                        { value: 0, label: "No incident response plan" },
                      ]),
                    }],
                  },
                },
              ],
            },
          },
          {
            code: "RC", name: "Recover", order: 6,
            controls: {
              create: [
                {
                  controlId: "RC.RP-01", order: 1,
                  title: "Recovery Planning",
                  description: "Recovery plans incorporate lessons learned",
                  questions: {
                    create: [{
                      order: 1,
                      text: "Do you have documented and tested recovery plans with defined RTO/RPO for critical systems?",
                      options: JSON.stringify([
                        { value: 3, label: "Recovery plans documented, tested, RTO/RPO defined and validated" },
                        { value: 2, label: "Plans exist with defined RTO/RPO but not recently tested" },
                        { value: 1, label: "Informal backups only — no formal recovery plan" },
                        { value: 0, label: "No recovery plan or backup strategy" },
                      ]),
                    }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  const iso = await prisma.framework.upsert({
    where: { slug: "iso-27001-2022" },
    update: {},
    create: {
      slug: "iso-27001-2022",
      name: "ISO/IEC 27001:2022",
      shortName: "ISO 27001",
      version: "2022",
      region: "Global",
      description: "Information Security Management System — international standard",
    },
  });

  const gdpr = await prisma.framework.upsert({
    where: { slug: "gdpr" },
    update: {},
    create: {
      slug: "gdpr",
      name: "General Data Protection Regulation",
      shortName: "GDPR",
      version: "2018",
      region: "EU",
      description: "EU data protection and privacy regulation",
    },
  });

  const nis2 = await prisma.framework.upsert({
    where: { slug: "nis2" },
    update: {},
    create: {
      slug: "nis2",
      name: "NIS2 Directive",
      shortName: "NIS2",
      version: "2022",
      region: "EU",
      description: "EU cybersecurity requirements for essential and important entities",
    },
  });

  const pci = await prisma.framework.upsert({
    where: { slug: "pci-dss-4" },
    update: {},
    create: {
      slug: "pci-dss-4",
      name: "PCI DSS 4.0",
      shortName: "PCI DSS",
      version: "4.0",
      region: "Global",
      description: "Payment Card Industry Data Security Standard",
    },
  });

  const pciOptions = JSON.stringify([
    { value: 3, label: "Fully implemented, documented, and regularly validated" },
    { value: 2, label: "Partially implemented with minor gaps" },
    { value: 1, label: "Ad-hoc or inconsistently implemented" },
    { value: 0, label: "Not implemented" },
  ]);

  const pciRequirements: Array<{
    code: string;
    name: string;
    controls: Array<{ controlId: string; title: string; description: string; mapTo: string }>;
  }> = [
    { code: "R1", name: "Network Security Controls", controls: [
      { controlId: "R1.1", title: "Firewall and network security policies", description: "Define and maintain network security control standards.", mapTo: "PR.AC-01" },
      { controlId: "R1.2", title: "Restrict inbound and outbound traffic", description: "Allow only authorized protocols and services.", mapTo: "PR.DS-01" },
      { controlId: "R1.3", title: "Segment and isolate CDE networks", description: "Limit network access to cardholder data environment.", mapTo: "PR.AC-01" },
    ] },
    { code: "R2", name: "Secure Configurations", controls: [
      { controlId: "R2.1", title: "Change vendor default credentials", description: "Remove insecure default configurations.", mapTo: "ID.AM-01" },
      { controlId: "R2.2", title: "Harden system configurations", description: "Apply secure baseline standards to systems.", mapTo: "PR.AC-01" },
      { controlId: "R2.3", title: "Maintain configuration inventories", description: "Track critical components and secure states.", mapTo: "ID.AM-02" },
    ] },
    { code: "R3", name: "Stored Account Data Protection", controls: [
      { controlId: "R3.1", title: "Minimize retained account data", description: "Keep only required cardholder data.", mapTo: "PR.DS-01" },
      { controlId: "R3.3", title: "Mask PAN when displayed", description: "Ensure PAN masking for users without business need.", mapTo: "PR.DS-01" },
      { controlId: "R3.5", title: "Protect cryptographic keys", description: "Secure key storage and lifecycle management.", mapTo: "PR.DS-01" },
    ] },
    { code: "R4", name: "Data-in-Transit Encryption", controls: [
      { controlId: "R4.1", title: "Use strong cryptography in transit", description: "Encrypt cardholder data over open networks.", mapTo: "PR.DS-01" },
      { controlId: "R4.2", title: "Disallow weak cipher suites", description: "Disable insecure protocols and ciphers.", mapTo: "PR.DS-01" },
      { controlId: "R4.3", title: "Certificate lifecycle management", description: "Manage certificate validity and rotation.", mapTo: "PR.DS-01" },
    ] },
    { code: "R5", name: "Malware Protection", controls: [
      { controlId: "R5.1", title: "Deploy anti-malware protections", description: "Protect systems from malware execution.", mapTo: "DE.CM-01" },
      { controlId: "R5.2", title: "Keep signatures and engines updated", description: "Maintain timely malware protection updates.", mapTo: "PR.AC-01" },
      { controlId: "R5.3", title: "Run periodic malware scans", description: "Execute scheduled and event-driven scans.", mapTo: "PR.DS-01" },
    ] },
    { code: "R6", name: "Secure Development", controls: [
      { controlId: "R6.1", title: "Secure SDLC governance", description: "Define secure development lifecycle practices.", mapTo: "GV.RM-01" },
      { controlId: "R6.2", title: "Code review for custom software", description: "Review bespoke code before deployment.", mapTo: "PR.DS-01" },
      { controlId: "R6.4", title: "Protect public apps with WAF", description: "Apply web application firewall controls.", mapTo: "DE.CM-01" },
    ] },
    { code: "R7", name: "Access Restriction", controls: [
      { controlId: "R7.1", title: "Document access control policy", description: "Define least-privilege access strategy.", mapTo: "GV.RM-01" },
      { controlId: "R7.2", title: "Need-to-know enforcement", description: "Limit data access based on job role.", mapTo: "PR.AC-01" },
      { controlId: "R7.3", title: "Centralized access control", description: "Use managed mechanisms for access approvals.", mapTo: "PR.AC-01" },
    ] },
    { code: "R8", name: "User Authentication", controls: [
      { controlId: "R8.1", title: "Identity and account policies", description: "Maintain account lifecycle and standards.", mapTo: "PR.AC-01" },
      { controlId: "R8.2", title: "Unique user IDs", description: "Assign individual IDs for all access.", mapTo: "PR.AC-01" },
      { controlId: "R8.3", title: "Multi-factor authentication", description: "Enforce MFA for admin and remote access.", mapTo: "PR.AC-01" },
    ] },
    { code: "R9", name: "Physical Security", controls: [
      { controlId: "R9.1", title: "Physical access controls", description: "Restrict physical access to sensitive systems.", mapTo: "PR.AC-01" },
      { controlId: "R9.3", title: "Badge and entry management", description: "Use controlled entry and card access.", mapTo: "PR.AC-01" },
      { controlId: "R9.4", title: "Visitor access procedures", description: "Track and escort visitors in secure zones.", mapTo: "PR.DS-01" },
    ] },
    { code: "R10", name: "Logging and Monitoring", controls: [
      { controlId: "R10.1", title: "Enable audit logging", description: "Collect security-relevant logs from systems.", mapTo: "DE.CM-01" },
      { controlId: "R10.2", title: "Capture required event types", description: "Log authentication, admin, and data access events.", mapTo: "DE.CM-01" },
      { controlId: "R10.5", title: "Retain and review logs", description: "Protect and review logs for incident detection.", mapTo: "RS.RP-01" },
    ] },
    { code: "R11", name: "Security Testing", controls: [
      { controlId: "R11.1", title: "Wireless security testing", description: "Perform tests for rogue and insecure wireless access.", mapTo: "DE.CM-01" },
      { controlId: "R11.2", title: "Vulnerability scanning", description: "Run internal and external vulnerability scans.", mapTo: "ID.AM-02" },
      { controlId: "R11.3", title: "Penetration testing", description: "Conduct periodic penetration testing.", mapTo: "RS.RP-01" },
    ] },
    { code: "R12", name: "Policy and Program", controls: [
      { controlId: "R12.1", title: "Security policy framework", description: "Maintain security policies and governance.", mapTo: "GV.OC-01" },
      { controlId: "R12.3", title: "Risk assessment program", description: "Perform regular risk assessments.", mapTo: "GV.RM-01" },
      { controlId: "R12.6", title: "Security awareness training", description: "Provide recurring security awareness training.", mapTo: "GV.OC-01" },
    ] },
  ];

  const pciDomainCount = await prisma.domain.count({ where: { frameworkId: pci.id } });
  if (pciDomainCount === 0) {
    for (let i = 0; i < pciRequirements.length; i += 1) {
      const req = pciRequirements[i];
      await prisma.domain.create({
        data: {
          frameworkId: pci.id,
          code: req.code,
          name: req.name,
          order: i + 1,
          controls: {
            create: req.controls.map((control, idx) => ({
              controlId: control.controlId,
              order: idx + 1,
              title: control.title,
              description: control.description,
              questions: {
                create: [{
                  order: 1,
                  text: `How effectively is ${control.title.toLowerCase()} implemented and maintained?`,
                  helpText: `PCI DSS ${control.controlId}. Maps to NIST CSF: ${control.mapTo}`,
                  options: pciOptions,
                }],
              },
            })),
          },
        },
      });
    }
  }

  console.log("✅ Frameworks seeded");

  // ── ISO 27001:2022 DOMAINS + CONTROLS ───────────────────────────────────────
  const isoOptions = JSON.stringify([
    { value: 3, label: "Fully implemented and regularly reviewed" },
    { value: 2, label: "Partially implemented with gaps" },
    { value: 1, label: "Ad-hoc or inconsistently applied" },
    { value: 0, label: "Not implemented" },
  ]);

  const isoDomainCount = await prisma.domain.count({ where: { frameworkId: iso.id } });
  if (isoDomainCount === 0) {
    const isoDomains = [
      { code: "A.5", name: "Information Security Policies", controls: [
        { controlId: "A.5.1", title: "Policies for information security", mapTo: "GV.OC-01" },
        { controlId: "A.5.2", title: "Review of policies for information security", mapTo: "GV.OC-01" },
      ]},
      { code: "A.6", name: "Organisation of Information Security", controls: [
        { controlId: "A.6.1", title: "Internal organisation", mapTo: "GV.RM-01" },
        { controlId: "A.6.2", title: "Mobile devices and remote working", mapTo: "PR.AC-01" },
        { controlId: "A.6.3", title: "Information security in project management", mapTo: "GV.RM-01" },
      ]},
      { code: "A.7", name: "Human Resource Security", controls: [
        { controlId: "A.7.1", title: "Prior to employment", mapTo: "GV.RM-01" },
        { controlId: "A.7.2", title: "During employment", mapTo: "GV.OC-01" },
        { controlId: "A.7.3", title: "Termination and change of employment", mapTo: "PR.AC-01" },
      ]},
      { code: "A.8", name: "Asset Management", controls: [
        { controlId: "A.8.1", title: "Responsibility for assets", mapTo: "ID.AM-01" },
        { controlId: "A.8.2", title: "Information classification", mapTo: "PR.DS-01" },
        { controlId: "A.8.3", title: "Media handling", mapTo: "PR.DS-01" },
        { controlId: "A.8.5", title: "Transfer of information", mapTo: "PR.DS-01" },
      ]},
    ];

    for (let i = 0; i < isoDomains.length; i += 1) {
      const d = isoDomains[i];
      await prisma.domain.create({
        data: {
          frameworkId: iso.id,
          code: d.code,
          name: d.name,
          order: i + 1,
          controls: {
            create: d.controls.map((c, idx) => ({
              controlId: c.controlId,
              order: idx + 1,
              title: c.title,
              description: c.title,
              questions: {
                create: [{
                  order: 1,
                  text: `How effectively is ${c.title.toLowerCase()} implemented and maintained?`,
                  helpText: `ISO 27001:2022 ${c.controlId}. Cross-maps to NIST CSF: ${c.mapTo}`,
                  options: isoOptions,
                }],
              },
            })),
          },
        },
      });
    }
  }

  // ── NIS2 DOMAINS + CONTROLS ───────────────────────────────────────────────
  const nis2Options = JSON.stringify([
    { value: 3, label: "Fully implemented with evidence" },
    { value: 2, label: "Partially implemented" },
    { value: 1, label: "Initial / ad-hoc" },
    { value: 0, label: "Not implemented" },
  ]);

  const nis2DomainCount = await prisma.domain.count({ where: { frameworkId: nis2.id } });
  if (nis2DomainCount === 0) {
    const nis2Domains = [
      { code: "Art20", name: "Article 20 — Security Measures", controls: [
        { controlId: "N20.1", title: "Risk analysis and security policies", mapTo: "GV.RM-01" },
        { controlId: "N20.2", title: "Incident handling and reporting", mapTo: "RS.RP-01" },
        { controlId: "N20.3", title: "Business continuity and crisis management", mapTo: "RC.RP-01" },
      ]},
      { code: "Art21", name: "Article 21 — Risk Management", controls: [
        { controlId: "N21.1", title: "Appropriate security measures", mapTo: "PR.AC-01" },
        { controlId: "N21.2", title: "Supply chain security", mapTo: "GV.RM-01" },
        { controlId: "N21.3", title: "Asset security and encryption", mapTo: "PR.DS-01" },
      ]},
      { code: "Art30", name: "Article 30 — Role of National Authorities", controls: [
        { controlId: "N30.1", title: "Cooperation with authorities", mapTo: "GV.OC-01" },
        { controlId: "N30.2", title: "Supervision and enforcement", mapTo: "GV.OC-01" },
      ]},
    ];

    for (let i = 0; i < nis2Domains.length; i += 1) {
      const d = nis2Domains[i];
      await prisma.domain.create({
        data: {
          frameworkId: nis2.id,
          code: d.code,
          name: d.name,
          order: i + 1,
          controls: {
            create: d.controls.map((c, idx) => ({
              controlId: c.controlId,
              order: idx + 1,
              title: c.title,
              description: c.title,
              questions: {
                create: [{
                  order: 1,
                  text: `How effectively is ${c.title.toLowerCase()} implemented?`,
                  helpText: `NIS2 ${c.controlId}. Cross-maps to NIST CSF: ${c.mapTo}`,
                  options: nis2Options,
                }],
              },
            })),
          },
        },
      });
    }
  }

  // ── DEMO vCISO USER ──────────────────────────────────────────────────────────
  const vcisoPassword = await bcrypt.hash("Demo1234!", 12);
  const vciso = await prisma.user.upsert({
    where: { email: "khaled@cisolens.io" },
    update: {},
    create: {
      email: "khaled@cisolens.io",
      passwordHash: vcisoPassword,
      firstName: "Khaled",
      lastName: "Demo",
      role: "VCISO",
    },
  });

  console.log("✅ vCISO user seeded — khaled@cisolens.io / Demo1234!");

  // ── DEMO CLIENT ORGS ─────────────────────────────────────────────────────────
  const orgs = [
    { name: "MEAPAL Egypt", shortCode: "ME", sector: "Financial Services", country: "EG", contactName: "Ahmed Hassan", contactEmail: "ahmed@meapal.com", logoColor: "#00d4ff" },
    { name: "Axway France", shortCode: "AX", sector: "Technology", country: "FR", contactName: "Marie Dupont", contactEmail: "marie@axway.com", logoColor: "#00e5a0" },
    { name: "Celio Group", shortCode: "CG", sector: "Retail", country: "FR", contactName: "Pierre Martin", contactEmail: "pierre@celio.com", logoColor: "#a78bfa" },
  ];

  for (const org of orgs) {
    await prisma.clientOrg.upsert({
      where: { id: `demo-${org.shortCode.toLowerCase()}` },
      update: {},
      create: {
        id: `demo-${org.shortCode.toLowerCase()}`,
        ...org,
        vcisoId: vciso.id,
        orgFrameworks: {
          create: [
            { frameworkId: nist.id },
            { frameworkId: iso.id },
          ],
        },
      },
    });
  }

  console.log("✅ Demo client orgs seeded");
  console.log("\n🚀 Seed complete!");
  console.log("   Login: khaled@cisolens.io / Demo1234!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
