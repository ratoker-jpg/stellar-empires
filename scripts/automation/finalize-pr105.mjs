import { readFile, writeFile, rm } from 'node:fs/promises';

const mergeSha = 'af6954564531caa81c3dd83f924e3696ad984165';
const textPaths = [
  'docs/17-continuation-guide.md',
  'docs/audits/batch-history.md',
  'docs/audits/current-batch-audit.md',
  'docs/audits/current-execution-state.md',
  'docs/audits/completed/asset-runtime-integration-01.md',
];
for (const filePath of textPaths) {
  let content = await readFile(filePath, 'utf8');
  content = content.replaceAll('PR105_MERGE_SHA_PENDING', mergeSha);
  content = content.replace(
    '**Implementation started:** no',
    '**Implementation completed:** yes',
  );
  await writeFile(filePath, content);
}

const statusPath = 'docs/project-status.json';
const status = JSON.parse(await readFile(statusPath, 'utf8'));
status.lastMergedPr = 105;
status.lastMergeSha = mergeSha;
status.activePr = null;
status.nextPrAfterActive = 106;
status.nextPrKind = 'audit';
status.currentAudit = 'docs/audits/completed/asset-runtime-integration-01.md';
status.currentAuditContracts = [];
status.currentBatch.auditStatus = 'completed';
status.currentBatch.status = 'completed';
status.currentBatch.nextWorkItem = null;
status.currentBatch.archivedAudit = 'docs/audits/completed/asset-runtime-integration-01.md';
status.activeDelivery = [
  'ASSET-RUNTIME-INTEGRATION-01 completed and archived',
  '217 complete mechanical IDs resolve through 173 generated runtime images',
  'next implementation requires a fresh dedicated Audit PR',
];
status.sourceAssetIntake.catalogArt.status = 'runtime-integrated-complete';
status.requiredStartupReading = [
  'AGENTS.md',
  'docs/28-audit-first-autonomous-delivery-protocol.md',
  'docs/audits/current-execution-state.md',
  'docs/audits/completed/asset-runtime-integration-01.md',
  'docs/17-continuation-guide.md',
  'docs/project-status.json',
  'docs/27-playable-game-roadmap-v5.md',
  'docs/asset-prompts/master-runtime-asset-backlog.md',
  'docs/25-solar-war-obelisks-gates-and-progression.md',
  'docs/26-universe-galaxy-solar-system-navigation-contract.md',
  'latest merged GitHub pull requests',
];
await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`);

await rm('scripts/automation/finalize-pr105.mjs', { force: true });
await rm('.github/workflows/finalize-pr105.yml', { force: true });
