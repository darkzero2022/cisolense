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

  // ── ISO 27001:2022 DOMAINS + CONTROLS (full 93 Annex A controls) ────────────
  const isoOptions = JSON.stringify([
    { value: 3, label: "Fully implemented and regularly reviewed" },
    { value: 2, label: "Partially implemented with gaps" },
    { value: 1, label: "Ad-hoc or inconsistently applied" },
    { value: 0, label: "Not implemented" },
  ]);

  // Always refresh ISO 27001 to ensure full 93-control coverage
  await prisma.domain.deleteMany({ where: { frameworkId: iso.id } });

  const isoDomains: Array<{
    code: string; name: string; order: number;
    controls: Array<{ controlId: string; title: string; mapTo: string; pci?: string }>;
  }> = [
    {
      code: "A.5", name: "Organisational Controls", order: 1,
      controls: [
        { controlId: "A.5.1",  title: "Policies for information security",                           mapTo: "GV.OC-01" },
        { controlId: "A.5.2",  title: "Information security roles and responsibilities",              mapTo: "GV.OC-01" },
        { controlId: "A.5.3",  title: "Segregation of duties",                                       mapTo: "PR.AC-01" },
        { controlId: "A.5.4",  title: "Management responsibilities",                                  mapTo: "GV.OC-01" },
        { controlId: "A.5.5",  title: "Contact with authorities",                                     mapTo: "RS.RP-01" },
        { controlId: "A.5.6",  title: "Contact with special interest groups",                         mapTo: "GV.RM-01" },
        { controlId: "A.5.7",  title: "Threat intelligence",                                          mapTo: "DE.CM-01" },
        { controlId: "A.5.8",  title: "Information security in project management",                   mapTo: "GV.RM-01" },
        { controlId: "A.5.9",  title: "Inventory of information and other associated assets",         mapTo: "ID.AM-01" },
        { controlId: "A.5.10", title: "Acceptable use of information and other associated assets",    mapTo: "GV.OC-01" },
        { controlId: "A.5.11", title: "Return of assets",                                             mapTo: "ID.AM-01" },
        { controlId: "A.5.12", title: "Classification of information",                                mapTo: "PR.DS-01" },
        { controlId: "A.5.13", title: "Labelling of information",                                     mapTo: "PR.DS-01" },
        { controlId: "A.5.14", title: "Information transfer",                                         mapTo: "PR.DS-01" },
        { controlId: "A.5.15", title: "Access control",                                               mapTo: "PR.AC-01", pci: "R7.1, R8.1" },
        { controlId: "A.5.16", title: "Identity management",                                          mapTo: "PR.AC-01", pci: "R8.1" },
        { controlId: "A.5.17", title: "Authentication information",                                   mapTo: "PR.AC-01", pci: "R8.2, R8.3" },
        { controlId: "A.5.18", title: "Access rights",                                                mapTo: "PR.AC-01", pci: "R7.2" },
        { controlId: "A.5.19", title: "Information security in supplier relationships",               mapTo: "GV.RM-01" },
        { controlId: "A.5.20", title: "Addressing information security within supplier agreements",   mapTo: "GV.RM-01" },
        { controlId: "A.5.21", title: "Managing information security in the ICT supply chain",       mapTo: "GV.RM-01" },
        { controlId: "A.5.22", title: "Monitoring, review and change management of supplier services", mapTo: "DE.CM-01" },
        { controlId: "A.5.23", title: "Information security for use of cloud services",              mapTo: "GV.RM-01" },
        { controlId: "A.5.24", title: "Information security incident management planning and preparation", mapTo: "RS.RP-01" },
        { controlId: "A.5.25", title: "Assessment and decision on information security events",      mapTo: "RS.RP-01" },
        { controlId: "A.5.26", title: "Response to information security incidents",                  mapTo: "RS.RP-01" },
        { controlId: "A.5.27", title: "Learning from information security incidents",                mapTo: "RS.RP-01" },
        { controlId: "A.5.28", title: "Collection of evidence",                                      mapTo: "RS.RP-01" },
        { controlId: "A.5.29", title: "Information security during disruption",                      mapTo: "RC.RP-01" },
        { controlId: "A.5.30", title: "ICT readiness for business continuity",                       mapTo: "RC.RP-01" },
        { controlId: "A.5.31", title: "Legal, statutory, regulatory and contractual requirements",   mapTo: "GV.OC-01" },
        { controlId: "A.5.32", title: "Intellectual property rights",                                mapTo: "GV.OC-01" },
        { controlId: "A.5.33", title: "Protection of records",                                       mapTo: "PR.DS-01" },
        { controlId: "A.5.34", title: "Privacy and protection of personally identifiable information", mapTo: "PR.DS-01" },
        { controlId: "A.5.35", title: "Independent review of information security",                  mapTo: "GV.RM-01" },
        { controlId: "A.5.36", title: "Compliance with policies, rules and standards for information security", mapTo: "GV.OC-01" },
        { controlId: "A.5.37", title: "Documented operating procedures",                             mapTo: "GV.OC-01" },
      ],
    },
    {
      code: "A.6", name: "People Controls", order: 2,
      controls: [
        { controlId: "A.6.1", title: "Screening",                                                    mapTo: "GV.OC-01" },
        { controlId: "A.6.2", title: "Terms and conditions of employment",                           mapTo: "GV.OC-01" },
        { controlId: "A.6.3", title: "Information security awareness, education and training",       mapTo: "GV.OC-01" },
        { controlId: "A.6.4", title: "Disciplinary process",                                         mapTo: "GV.OC-01" },
        { controlId: "A.6.5", title: "Responsibilities after termination or change of employment",   mapTo: "PR.AC-01" },
        { controlId: "A.6.6", title: "Confidentiality or non-disclosure agreements",                 mapTo: "GV.OC-01" },
        { controlId: "A.6.7", title: "Remote working",                                               mapTo: "PR.AC-01" },
        { controlId: "A.6.8", title: "Information security event reporting",                         mapTo: "RS.RP-01" },
      ],
    },
    {
      code: "A.7", name: "Physical Controls", order: 3,
      controls: [
        { controlId: "A.7.1",  title: "Physical security perimeters",                                mapTo: "PR.AC-01", pci: "R9.1" },
        { controlId: "A.7.2",  title: "Physical entry",                                              mapTo: "PR.AC-01", pci: "R9.3" },
        { controlId: "A.7.3",  title: "Securing offices, rooms and facilities",                      mapTo: "PR.AC-01" },
        { controlId: "A.7.4",  title: "Physical security monitoring",                                mapTo: "DE.CM-01" },
        { controlId: "A.7.5",  title: "Protecting against physical and environmental threats",       mapTo: "RC.RP-01" },
        { controlId: "A.7.6",  title: "Working in secure areas",                                     mapTo: "PR.AC-01" },
        { controlId: "A.7.7",  title: "Clear desk and clear screen",                                 mapTo: "PR.DS-01" },
        { controlId: "A.7.8",  title: "Equipment siting and protection",                             mapTo: "ID.AM-01" },
        { controlId: "A.7.9",  title: "Security of assets off-premises",                             mapTo: "ID.AM-01" },
        { controlId: "A.7.10", title: "Storage media",                                               mapTo: "PR.DS-01", pci: "R9.4" },
        { controlId: "A.7.11", title: "Supporting utilities",                                        mapTo: "RC.RP-01" },
        { controlId: "A.7.12", title: "Cabling security",                                            mapTo: "PR.AC-01" },
        { controlId: "A.7.13", title: "Equipment maintenance",                                       mapTo: "ID.AM-01" },
        { controlId: "A.7.14", title: "Secure disposal or re-use of equipment",                      mapTo: "PR.DS-01" },
      ],
    },
    {
      code: "A.8", name: "Technological Controls", order: 4,
      controls: [
        { controlId: "A.8.1",  title: "User endpoint devices",                                       mapTo: "ID.AM-01" },
        { controlId: "A.8.2",  title: "Privileged access rights",                                    mapTo: "PR.AC-01", pci: "R7.2, R8.2" },
        { controlId: "A.8.3",  title: "Information access restriction",                              mapTo: "PR.AC-01", pci: "R7.2" },
        { controlId: "A.8.4",  title: "Access to source code",                                       mapTo: "PR.AC-01" },
        { controlId: "A.8.5",  title: "Secure authentication",                                       mapTo: "PR.AC-01", pci: "R8.3" },
        { controlId: "A.8.6",  title: "Capacity management",                                         mapTo: "ID.AM-02" },
        { controlId: "A.8.7",  title: "Protection against malware",                                  mapTo: "DE.CM-01", pci: "R5.1, R5.2" },
        { controlId: "A.8.8",  title: "Management of technical vulnerabilities",                     mapTo: "DE.CM-01", pci: "R11.2" },
        { controlId: "A.8.9",  title: "Configuration management",                                    mapTo: "ID.AM-02", pci: "R2.2" },
        { controlId: "A.8.10", title: "Information deletion",                                        mapTo: "PR.DS-01" },
        { controlId: "A.8.11", title: "Data masking",                                                mapTo: "PR.DS-01", pci: "R3.3" },
        { controlId: "A.8.12", title: "Data leakage prevention",                                     mapTo: "PR.DS-01" },
        { controlId: "A.8.13", title: "Information backup",                                          mapTo: "RC.RP-01" },
        { controlId: "A.8.14", title: "Redundancy of information processing facilities",             mapTo: "RC.RP-01" },
        { controlId: "A.8.15", title: "Logging",                                                     mapTo: "DE.CM-01", pci: "R10.1, R10.2" },
        { controlId: "A.8.16", title: "Monitoring activities",                                       mapTo: "DE.CM-01", pci: "R10.5" },
        { controlId: "A.8.17", title: "Clock synchronisation",                                       mapTo: "DE.CM-01" },
        { controlId: "A.8.18", title: "Use of privileged utility programs",                          mapTo: "PR.AC-01" },
        { controlId: "A.8.19", title: "Installation of software on operational systems",             mapTo: "ID.AM-02", pci: "R6.1" },
        { controlId: "A.8.20", title: "Networks security",                                           mapTo: "PR.AC-01", pci: "R1.1" },
        { controlId: "A.8.21", title: "Security of network services",                                mapTo: "PR.AC-01", pci: "R1.2" },
        { controlId: "A.8.22", title: "Segregation of networks",                                     mapTo: "PR.AC-01", pci: "R1.3" },
        { controlId: "A.8.23", title: "Web filtering",                                               mapTo: "DE.CM-01" },
        { controlId: "A.8.24", title: "Use of cryptography",                                         mapTo: "PR.DS-01", pci: "R4.1, R4.2" },
        { controlId: "A.8.25", title: "Secure development life cycle",                               mapTo: "GV.RM-01", pci: "R6.1" },
        { controlId: "A.8.26", title: "Application security requirements",                           mapTo: "GV.RM-01", pci: "R6.2" },
        { controlId: "A.8.27", title: "Secure system architecture and engineering principles",       mapTo: "GV.RM-01" },
        { controlId: "A.8.28", title: "Secure coding",                                               mapTo: "GV.RM-01", pci: "R6.2" },
        { controlId: "A.8.29", title: "Security testing in development and acceptance",              mapTo: "DE.CM-01", pci: "R11.3" },
        { controlId: "A.8.30", title: "Outsourced development",                                      mapTo: "GV.RM-01" },
        { controlId: "A.8.31", title: "Separation of development, test and production environments", mapTo: "GV.RM-01" },
        { controlId: "A.8.32", title: "Change management",                                           mapTo: "GV.RM-01" },
        { controlId: "A.8.33", title: "Test information",                                            mapTo: "PR.DS-01" },
        { controlId: "A.8.34", title: "Protection of information systems during audit testing",      mapTo: "PR.AC-01" },
      ],
    },
  ];

  for (const d of isoDomains) {
    await prisma.domain.create({
      data: {
        frameworkId: iso.id,
        code: d.code,
        name: d.name,
        order: d.order,
        controls: {
          create: d.controls.map((c, idx) => ({
            controlId: c.controlId,
            order: idx + 1,
            title: c.title,
            description: c.title,
            questions: {
              create: [{
                order: 1,
                text: `How effectively is "${c.title}" implemented and maintained?`,
                helpText: c.pci
                  ? `ISO 27001:2022 ${c.controlId}. Maps to NIST CSF: ${c.mapTo} | PCI DSS: ${c.pci}`
                  : `ISO 27001:2022 ${c.controlId}. Maps to NIST CSF: ${c.mapTo}`,
                options: isoOptions,
              }],
            },
          })),
        },
      },
    });
  }

  console.log("✅ ISO 27001:2022 seeded — 4 domains, 93 controls");

  // ── NIS2 DIRECTIVE DOMAINS + CONTROLS (full ~30 controls) ───────────────────
  const nis2Options = JSON.stringify([
    { value: 3, label: "Fully implemented with evidence" },
    { value: 2, label: "Partially implemented" },
    { value: 1, label: "Initial / ad-hoc" },
    { value: 0, label: "Not implemented" },
  ]);

  // Always refresh NIS2 to ensure full coverage
  await prisma.domain.deleteMany({ where: { frameworkId: nis2.id } });

  const nis2Domains: Array<{
    code: string; name: string; order: number;
    controls: Array<{ controlId: string; title: string; mapTo: string; iso?: string; pci?: string }>;
  }> = [
    {
      code: "Art20", name: "Article 20 — Governance & Accountability", order: 1,
      controls: [
        { controlId: "N20.1", title: "Management body approval of cybersecurity measures",           mapTo: "GV.OC-01", iso: "A.5.1, A.5.4",  pci: "R12.1" },
        { controlId: "N20.2", title: "Management body cybersecurity training",                        mapTo: "GV.OC-01", iso: "A.6.3",          pci: "R12.6" },
        { controlId: "N20.3", title: "Management liability and oversight",                            mapTo: "GV.OC-01", iso: "A.5.4, A.5.35",  pci: "R12.1" },
      ],
    },
    {
      code: "Art21", name: "Article 21 — Cybersecurity Risk-Management Measures", order: 2,
      controls: [
        { controlId: "N21.1",  title: "Policies on risk analysis and information system security",   mapTo: "GV.RM-01", iso: "A.5.1, A.5.8",   pci: "R12.3" },
        { controlId: "N21.2",  title: "Incident handling",                                           mapTo: "RS.RP-01", iso: "A.5.24, A.5.26"                },
        { controlId: "N21.3",  title: "Business continuity, backup and disaster recovery",           mapTo: "RC.RP-01", iso: "A.5.29, A.8.13"                },
        { controlId: "N21.4",  title: "Supply chain security",                                       mapTo: "GV.RM-01", iso: "A.5.19, A.5.21", pci: "R12.3" },
        { controlId: "N21.5",  title: "Security in network and information systems acquisition and development", mapTo: "GV.RM-01", iso: "A.8.25, A.8.26", pci: "R6.1, R6.2" },
        { controlId: "N21.6",  title: "Policies and procedures to assess effectiveness of measures", mapTo: "GV.RM-01", iso: "A.5.35, A.5.36", pci: "R12.3" },
        { controlId: "N21.7",  title: "Basic cyber hygiene practices and cybersecurity training",    mapTo: "GV.OC-01", iso: "A.6.3",           pci: "R12.6" },
        { controlId: "N21.8",  title: "Policies on use of cryptography and encryption",              mapTo: "PR.DS-01", iso: "A.8.24",          pci: "R4.1, R4.2" },
        { controlId: "N21.9",  title: "Human resources security, access control and asset management", mapTo: "PR.AC-01", iso: "A.5.9, A.5.15", pci: "R7.1, R8.1" },
        { controlId: "N21.10", title: "Use of multi-factor authentication",                          mapTo: "PR.AC-01", iso: "A.8.5",           pci: "R8.3" },
      ],
    },
    {
      code: "Art23", name: "Article 23 — Reporting Obligations", order: 3,
      controls: [
        { controlId: "N23.1", title: "Early warning within 24 hours of significant incident",        mapTo: "RS.RP-01", iso: "A.5.25" },
        { controlId: "N23.2", title: "Incident notification within 72 hours",                        mapTo: "RS.RP-01", iso: "A.5.26" },
        { controlId: "N23.3", title: "Intermediate report on request",                               mapTo: "RS.RP-01", iso: "A.5.26" },
        { controlId: "N23.4", title: "Final report within 1 month",                                  mapTo: "RS.RP-01", iso: "A.5.27" },
      ],
    },
    {
      code: "Art24", name: "Article 24 — Supply Chain Security", order: 4,
      controls: [
        { controlId: "N24.1", title: "Assessment of supply chain cybersecurity practices",           mapTo: "GV.RM-01", iso: "A.5.19, A.5.21", pci: "R12.3" },
        { controlId: "N24.2", title: "Contractual cybersecurity requirements with suppliers",        mapTo: "GV.RM-01", iso: "A.5.20",          pci: "R12.3" },
        { controlId: "N24.3", title: "Monitoring and auditing of suppliers",                         mapTo: "DE.CM-01", iso: "A.5.22"                        },
      ],
    },
    {
      code: "Art25", name: "Article 25 — Technical Standards", order: 5,
      controls: [
        { controlId: "N25.1", title: "Use of European cybersecurity certification schemes",          mapTo: "GV.OC-01", iso: "A.5.31" },
        { controlId: "N25.2", title: "Adoption of ENISA baseline guidelines",                        mapTo: "GV.OC-01", iso: "A.5.36" },
      ],
    },
    {
      code: "Art30", name: "Article 30 — Registration & Oversight", order: 6,
      controls: [
        { controlId: "N30.1", title: "Registration with national competent authority",               mapTo: "GV.OC-01", iso: "A.5.31" },
        { controlId: "N30.2", title: "Information provision to authority on request",                mapTo: "GV.OC-01", iso: "A.5.31" },
      ],
    },
  ];

  for (const d of nis2Domains) {
    await prisma.domain.create({
      data: {
        frameworkId: nis2.id,
        code: d.code,
        name: d.name,
        order: d.order,
        controls: {
          create: d.controls.map((c, idx) => {
            const parts = [`NIS2 ${c.controlId}. Maps to NIST CSF: ${c.mapTo}`];
            if (c.iso) parts.push(`ISO 27001: ${c.iso}`);
            if (c.pci) parts.push(`PCI DSS: ${c.pci}`);
            return {
              controlId: c.controlId,
              order: idx + 1,
              title: c.title,
              description: c.title,
              questions: {
                create: [{
                  order: 1,
                  text: `How effectively is "${c.title}" implemented?`,
                  helpText: parts.join(" | "),
                  options: nis2Options,
                }],
              },
            };
          }),
        },
      },
    });
  }

  console.log("✅ NIS2 Directive seeded — 6 domains, 24 controls");

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
