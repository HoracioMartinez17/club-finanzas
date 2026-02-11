# 🔐 Security Configuration Checklist

## ✅ What is PROTECTED (in .gitignore)

These files contain sensitive information and are NEVER committed to git:

```
.env                          # Local environment variables
.env.local                     # Local overrides
.env.*.local                   # Environment-specific secrets
.env.production.local          # Production secrets (local copy)
.env.development.local         # Development secrets (local copy)
CREDENCIALES.md               # Hardcoded credentials documentation
*.pem                         # SSL/TLS certificates
```

## 📝 How to Use Environment Variables

### 1. Copy the Example File

```bash
cp .env.example .env.local
```

### 2. Edit .env.local with Your Secrets

```bash
# Replace placeholder values with actual credentials
DATABASE_URL="your-actual-db-url"
JWT_SECRET="your-secure-random-secret"
AUTH_SECRET="your-secure-random-secret"
```

### 3. Never Commit .env.local

The `.gitignore` file protects this automatically.

## ⚠️ What NOT to Do

❌ **Don't**: Hardcode passwords in source code

```typescript
// BAD - Never do this
const password = "***REMOVED***";
```

❌ **Don't**: Commit `.env` files to git

```bash
# This will be rejected by .gitignore
git add .env.local
```

❌ **Don't**: Put real database credentials in seed files

```typescript
// BAD - Don't use hardcoded credentials as defaults
const dbUrl = process.env.DATABASE_URL || "postgresql://user:pass@host:5432/db";
```

✅ **Do**: Use environment variables with secure defaults

```typescript
// GOOD - Use env vars, fail loudly if not set
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is required");
```

## 🔒 Sensitive Data Locations

### Database Credentials

- **Safe**: In `.env.local` (ignored by git)
- **Unsafe**: In code or committed files

### API Keys

- **Safe**: In `.env.local` environment variables
- **Unsafe**: Hardcoded in files, committed CREDENCIALES.md

### Test/Demo Credentials

- **Safe**: In `.env` as environment variable defaults
- **Unsafe**: Hardcoded in `prisma/seed.ts`

### Secrets for Production

- **Safe**: In CI/CD secrets (GitHub Actions, Vercel, etc.)
- **Unsafe**: In `.env.production.local` on development machines

## 🚀 Deployment Checklist

Before deploying:

- [ ] All database credentials are set in hosting provider secrets
- [ ] JWT_SECRET and AUTH_SECRET use cryptographically secure random values
- [ ] No `.env` files are committed to git
- [ ] `.gitignore` includes all `.env*` patterns
- [ ] CREDENCIALES.md is removed from git history
- [ ] CI/CD pipelines use hosted secrets, not local files

## 🔄 If Credentials Were Exposed

1. **Immediately rotate** the exposed credentials in your actual systems
2. **Remove** the exposed credentials from code
3. **Add** to `.gitignore`
4. **Commit** the changes with a message like: `security: remove exposed credentials`
5. **Optionally**: Use `git filter-branch` or `BFG repo-cleaner` to remove from history
6. **Force push**: Only if the repo hasn't been cloned by others

## 📚 Files Protected

```
.gitignore
│
├── .env              (all environment files ignored)
├── .env.local
├── .env.*.local
├── *.pem             (certificates)
└── CREDENCIALES.md   (credentials documentation)
```

## ✨ Current Status

- ✅ `.gitignore` properly configured
- ✅ `.env.example` created as template
- ✅ Sensitive files protected from git
- ✅ No committed credentials in current branch

---

Last Updated: February 11, 2026
