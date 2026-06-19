from app.database import SessionLocal, init_db
from app.models import AiAuditLog, InternalAsset, PrivateNote, RagChunk, Report, SeverityLevel, User, UserRole
from app.rag.service import get_rag_service
from app.security import hash_password


USERS = [
    ("admin", "admin@vulnreport.local", "admin123", UserRole.admin, "Lab Admin"),
    ("attacker", "attacker@vulnreport.local", "attacker123", UserRole.user, "Attacker User"),
    ("victim", "victim@vulnreport.local", "victim123", UserRole.user, "Victim User"),
]


def get_or_create_user(db, username, email, password, role, display_name):
    user = db.query(User).filter(User.username == username).first()
    if user:
        return user
    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        role=role,
        display_name=display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seed_notes(db, user_b):
    if db.query(PrivateNote).filter(PrivateNote.owner_id == user_b.id).first():
        return
    db.add(
        PrivateNote(
            owner_id=user_b.id,
            title="Victim private remediation note",
            note_content="Victim private note: pending report contains internal staging endpoint and remediation plan.",
        )
    )
    db.commit()


def seed_reports(db, user_a):
    rag_service = get_rag_service()
    seeded_poison_titles = [
        "Poisoned CVE-2017-5638 misinformation advisory",
        "Poisoned CVE-2017-5638 exfiltration advisory",
        "Poisoned CVE-2021-41773 exfiltration advisory",
    ]
    poison_ids = [
        row[0]
        for row in db.query(Report.id)
        .filter(Report.title.in_(seeded_poison_titles))
        .all()
    ]
    if poison_ids:
        for report_id in poison_ids:
            rag_service.retriever.delete_report(report_id)
        db.query(AiAuditLog).filter(AiAuditLog.report_id.in_(poison_ids)).update(
            {AiAuditLog.report_id: None},
            synchronize_session=False,
        )
        db.query(RagChunk).filter(RagChunk.report_id.in_(poison_ids)).delete(synchronize_session=False)
        db.query(Report).filter(Report.id.in_(poison_ids)).delete(synchronize_session=False)
        db.commit()
    reports = [
        get_or_create_report(
            db,
            user_a,
            title="Apache Struts Jakarta Multipart Parser RCE",
            cve_id="CVE-2017-5638",
            severity=SeverityLevel.critical,
            description="Remote code execution in Apache Struts 2 Jakarta multipart parser.",
            content=(
                "CVE-2017-5638 is a critical remote code execution vulnerability in Apache Struts 2. "
                "Affected versions include Struts 2.3.5 through 2.3.31 and 2.5 through 2.5.10. "
                "Mitigation is to upgrade to Struts 2.3.32 or 2.5.10.1 or later."
            ),
            source_url="https://cwiki.apache.org/confluence/display/WW/S2-045",
        ),
        get_or_create_report(
            db,
            user_a,
            title="Apache Log4j JNDI Remote Code Execution",
            cve_id="CVE-2021-44228",
            severity=SeverityLevel.critical,
            description="Remote code execution in Apache Log4j through crafted JNDI lookups.",
            content=(
                "CVE-2021-44228 is a critical remote code execution vulnerability in Apache Log4j 2. "
                "Affected versions include Log4j 2.0-beta9 through 2.14.1 when message lookup substitution "
                "can trigger attacker-controlled JNDI requests. Mitigation is to upgrade to a fixed Log4j "
                "release such as 2.17.1 or later and remove vulnerable lookup behavior."
            ),
            source_url="https://cve.org/CVERecord?id=CVE-2021-44228",
        ),
        get_or_create_report(
            db,
            user_a,
            title="Apache HTTP Server Path Traversal and File Disclosure",
            cve_id="CVE-2021-41773",
            severity=SeverityLevel.high,
            description="Path traversal and file disclosure in Apache HTTP Server 2.4.49.",
            content=(
                "CVE-2021-41773 is a high severity path traversal vulnerability in Apache HTTP Server 2.4.49. "
                "A flaw in path normalization can allow attackers to map URLs to files outside the configured "
                "document root when vulnerable directory configuration is present. Mitigation is to upgrade to "
                "Apache HTTP Server 2.4.51 or later and review directory access controls."
            ),
            source_url="https://cve.org/CVERecord?id=CVE-2021-41773",
        ),
        get_or_create_report(
            db,
            user_a,
            title="MOVEit Transfer SQL Injection",
            cve_id="CVE-2023-34362",
            severity=SeverityLevel.critical,
            description="SQL injection in MOVEit Transfer that can lead to unauthorized data access.",
            content=(
                "CVE-2023-34362 is a critical SQL injection vulnerability in MOVEit Transfer. "
                "Attackers can exploit vulnerable MOVEit Transfer web applications to gain unauthorized "
                "access to database content and potentially exfiltrate files. Mitigation is to apply the "
                "vendor security patches, restrict exposed management interfaces, and review indicators of compromise."
            ),
            source_url="https://cve.org/CVERecord?id=CVE-2023-34362",
        ),
        get_or_create_report(
            db,
            user_a,
            title="XZ Utils Backdoor",
            cve_id="CVE-2024-3094",
            severity=SeverityLevel.critical,
            description="Malicious code in XZ Utils releases impacting some Linux distributions.",
            content=(
                "CVE-2024-3094 is a critical supply-chain compromise involving malicious code in XZ Utils "
                "versions 5.6.0 and 5.6.1. The backdoor can affect OpenSSH server authentication paths on "
                "some Linux distributions when linked through system libraries. Mitigation is to downgrade or "
                "upgrade to a known clean XZ Utils release and follow distribution-specific incident guidance."
            ),
            source_url="https://cve.org/CVERecord?id=CVE-2024-3094",
        ),
        get_or_create_report(
            db,
            user_a,
            title="OpenSSL Heartbeat Information Disclosure",
            cve_id="CVE-2014-0160",
            severity=SeverityLevel.high,
            description="Heartbleed information disclosure vulnerability in OpenSSL heartbeat handling.",
            content=(
                "CVE-2014-0160, also known as Heartbleed, is a high severity information disclosure "
                "vulnerability in OpenSSL heartbeat handling. A remote attacker can read portions of process "
                "memory from affected services, potentially exposing private keys, credentials, or session data. "
                "Mitigation is to upgrade OpenSSL to a fixed release, rotate exposed secrets, and reissue certificates."
            ),
            source_url="https://cve.org/CVERecord?id=CVE-2014-0160",
        ),
    ]
    for report in reports:
        rag_service.index_report(db, report)


def get_or_create_report(db, owner, **values):
    report = db.query(Report).filter(Report.title == values["title"]).first()
    if report:
        report.owner_id = owner.id
        for key, value in values.items():
            setattr(report, key, value)
        db.commit()
        db.refresh(report)
        return report
    report = Report(owner_id=owner.id, **values)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def seed_assets(db):
    db.query(InternalAsset).filter(InternalAsset.service_name == "struts-legacy").delete()
    upsert_asset(
        db,
        service_name="backend-api",
        service_type="api",
        version="FastAPI 0.115",
        host="backend-api",
        port=8000,
        status="running",
        runtime_metadata={"env": "staging", "config_path": "/app/.env"},
    )
    upsert_asset(
        db,
        service_name="postgres",
        service_type="database",
        version="PostgreSQL 16",
        host="postgres",
        port=5432,
        status="running",
        runtime_metadata={"env": "staging", "exposed_port": 5432},
    )
    db.commit()


def upsert_asset(db, **values):
    asset = db.query(InternalAsset).filter(InternalAsset.service_name == values["service_name"]).first()
    if asset:
        for key, value in values.items():
            setattr(asset, key, value)
        return asset
    asset = InternalAsset(**values)
    db.add(asset)
    return asset


def main():
    init_db()
    db = SessionLocal()
    try:
        seed_all(db)
    finally:
        db.close()


def seed_all(db):
    users = {
        username: get_or_create_user(db, username, email, password, role, display_name)
        for username, email, password, role, display_name in USERS
    }
    seed_notes(db, users["victim"])
    seed_reports(db, users["admin"])
    seed_assets(db)


if __name__ == "__main__":
    main()
