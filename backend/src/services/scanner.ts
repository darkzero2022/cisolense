/* eslint-disable @typescript-eslint/no-explicit-any */
type ScanFindingInput = {
  key: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  details: string;
};

const nmapLib: any = (() => {
  try {
    // node-nmap does not provide stable ESM typings in this project setup.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("node-nmap");
  } catch {
    return null;
  }
})();

export const FINDING_TO_CONTROLS: Record<string, string[]> = {
  open_high_risk_ports: ["PR.AC-01", "R1.3"],
  no_tls_detected: ["PR.DS-01", "R4.1"],
  outdated_os: ["R2.2"],
  smb_internet_exposed: ["PR.AC-01", "R1.2"],
};

const detectFromOpenPorts = (ports: Array<number>): ScanFindingInput[] => {
  const findings: ScanFindingInput[] = [];
  if (ports.some((p) => [23, 3389].includes(p))) {
    findings.push({
      key: "open_high_risk_ports",
      severity: "HIGH",
      details: "Detected exposed high-risk administrative ports (e.g., Telnet/RDP).",
    });
  }
  if (ports.includes(445)) {
    findings.push({
      key: "smb_internet_exposed",
      severity: "HIGH",
      details: "SMB appears exposed and may be reachable externally.",
    });
  }
  if (ports.includes(80) && !ports.includes(443)) {
    findings.push({
      key: "no_tls_detected",
      severity: "MEDIUM",
      details: "HTTP service detected without corresponding HTTPS endpoint.",
    });
  }
  return findings;
};

export async function runNetworkScan(target: string, scanType: "basic" | "full") {
  if (!nmapLib?.NmapScan) {
    return [
      {
        key: "open_high_risk_ports",
        severity: "HIGH" as const,
        details: `Scanner fallback mode for target ${target}. Validate local nmap installation for live scans.`,
      },
    ];
  }

  return new Promise<ScanFindingInput[]>((resolve) => {
    const args = scanType === "full" ? "-sV -O" : "-sS";
    const scan = new nmapLib.NmapScan(target, args);

    scan.on("complete", (hosts: any[]) => {
      const ports = hosts
        .flatMap((h) => h.openPorts || [])
        .map((p) => Number(p.port))
        .filter((v) => Number.isFinite(v));

      const findings = detectFromOpenPorts(ports);
      if (findings.length === 0) {
        findings.push({
          key: "outdated_os",
          severity: "LOW",
          details: "No critical open-port issues detected, but OS/version patch validation is recommended.",
        });
      }

      resolve(findings);
    });

    scan.on("error", () => {
      resolve([
        {
          key: "outdated_os",
          severity: "LOW",
          details: `Scan execution failed for ${target}; verify scanner host capabilities.`,
        },
      ]);
    });

    scan.startScan();
  });
}
