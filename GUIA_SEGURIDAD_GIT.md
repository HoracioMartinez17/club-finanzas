# Guía Completa: Cómo Limpiar Credenciales del Historial de Git

Una guía paso a paso para resolver y prevenir exposición de credenciales en repositories públicos.

---

## Parte 1: El Problema - ¿Qué Salió Mal?

### Escenario Inicial

Tu repositorio tenía **credenciales hardcodeadas** (contraseñas en el código) que fueron:

1. **Committeadas a git** (agregadas al control de versiones)
2. **Pusheadas a GitHub** (enviadas a servidor público)
3. **Visibles en el historial público** (cualquiera que clonee el repo o vea GitHub las ve)

### Las Credenciales Expuestas

```
prisma/seed.ts:
  - "Secure@Admin2024!"
  - "Secure@Tesorero2024!"

prisma/create-super-admin.ts:
  - "SuperAdmin123!"

prisma/create-test-club.ts:
  - "ClubAdmin123!"

.env.local:
  - sk_4dVkxbFDrcrXAqV7X-C0n (API key Prisma)
  - credenciales de base de datos
```

### ¿Por Qué Es Peligroso?

```
git log -p              # Cualquiera puede ver TODOS los cambios históricos
git show <commit>       # Puedo ver qué credenciales había en un commit específico
git blame archivo.ts    # Puedo ver quién puso la credencial y cuándo
```

**GitHub nunca borra datos.** Aunque elimines un archivo, el historial permanece en el servidor.

---

## Parte 2: Estrategia de Solución (5 Fases)

### Fase 1: Encontrar DÓNDE Están las Credenciales

**Objetivo:** Ubicar exactamente qué credenciales están expuestas

**Herramienta:** `grep` o búsqueda en el código

```bash
# Buscar patrones sospechosos
grep -r "SuperAdmin123" .
grep -r "Secure@" .
grep -r "password\s*=" .
grep -r "sk_" .
```

**En tu caso:**

```
✅ Encontramos: 5 credenciales en 3 archivos
```

---

### Fase 2: Mover Credenciales a Variables de Entorno

**Objetivo:** Sacar credenciales del código a archivos `.env` (ignorados por git)

**Patrón Seguro:**

```typescript
// ❌ MAL - Hardcodeado
const password = "SuperAdmin123!";

// ✅ BIEN - Variable de entorno con validación
const password = process.env.SUPERADMIN_PASSWORD;
if (!password) {
  throw new Error("SUPERADMIN_PASSWORD no definida en .env");
}
```

**Lo que hicimos:**

1. En `prisma/create-super-admin.ts`:

   ```typescript
   const password = process.env.SUPERADMIN_PASSWORD || "SuperAdmin123!";
   ```

   ↓

   ```typescript
   if (!process.env.SUPERADMIN_PASSWORD) {
     throw new Error("SUPERADMIN_PASSWORD requerida");
   }
   const password = process.env.SUPERADMIN_PASSWORD;
   ```

2. En `prisma/seed.ts`:
   ```typescript
   const adminPassword = process.env.TEST_ADMIN_PASSWORD || "Secure@Admin2024!";
   ```
   ↓
   ```typescript
   if (!process.env.TEST_ADMIN_PASSWORD) {
     throw new Error("TEST_ADMIN_PASSWORD no definida en .env");
   }
   const adminPassword = process.env.TEST_ADMIN_PASSWORD;
   ```

**Commits:** 233f3d5, 71e6dc9, 2ab6109

**¿Por qué funciona?**

- El archivo `.env` nunca sube a GitHub (está en `.gitignore`)
- El código ahora es seguro, sin secretos
- Pero el **historial viejo sigue teniendo las credenciales**

---

### Fase 3: Proteger Archivos Sensibles con `.gitignore`

**Objetivo:** Asegurar que archivos sensibles NUNCA suban a git en el futuro

**Lo que agregamos:**

```
# En .gitignore
.env
.env.local
.env.*.local
.env.example
prisma/create-super-admin.ts
prisma/create-test-club.ts
CREDENCIALES.md
*.pem
```

**¿Por qué cada uno?**

- `.env*` → Contienen contraseñas/keys
- `create-*.ts` → Scripts de usuario específicos
- `CREDENCIALES.md` → Documentación con test credentials
- `*.pem` → Claves criptográficas

**Comando:**

```bash
git rm --cached .env.example prisma/create-super-admin.ts prisma/create-test-club.ts
git add .gitignore SECURITY.md
git commit -m "security: remove sensitive files from tracking"
```

**Commits:** ec54d9a, cb9f701

**¿Por qué `--cached`?**

- `git rm` borra del working directory
- `git rm --cached` borra SOLO de git, mantiene el archivo local
- Así no pierdes los archivos, solo dejan de ser tracked

---

## Parte 4: LIMPIAR EL HISTORIAL (El Paso Crítico)

### El Problema Aún Existe

Aunque el código ahora es seguro, si alguien hace:

```bash
git log -p
git show 687f2bf6
```

Seguirá viendo las credenciales antiguas.

### Solución: BFG Repo-Cleaner

**¿Qué es BFG?** Una herramienta que reescribe el historial completo de git, removiendo datos específicos de TODOS los commits.

**Equivalente:** `git filter-branch`, pero más fácil y rápido.

---

## Parte 5: Implementación Detallada de BFG

### Paso 1: Descargar BFG

```powershell
# BFG requiere Java (normalmente ya lo tienes)
java -version

# Descargar BFG
cd $env:TEMP
Invoke-WebRequest -Uri "https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar" `
  -OutFile "bfg.jar"

# Verificar descarga
Get-Item bfg.jar | Select-Object Length, Name
# Should show: 14483456 bytes
```

### Paso 2: Crear Archivo de Filtro

```powershell
cd c:\Users\Usuario\Downloads

# Crear archivo con secretos a remover
@"
SuperAdmin123!
Secure@Admin2024!
Secure@Tesorero2024!
ClubAdmin123!
sk_4dVkxbFDrcrXAqV7X-C0n
"@ | Out-File -Encoding UTF8 secrets.txt
```

**¿Qué hace?**

- BFG buscará estas strings en TODOS los commits
- Las reemplazará con `***REMOVED***`
- Trabajará en todo el historial de forma automática

### Paso 3: Crear Mirror Clone

```bash
git clone --mirror tu-repo tu-repo.git
```

**¿Por qué `--mirror`?**

- Crea un clon "desnudo" (sin archivos, solo git internals)
- Es más seguro modificar un mirror que un working repo
- Si algo sale mal, tu repo local sigue intacto

### Paso 4: Ejecutar BFG

```bash
java -jar $env:TEMP\bfg.jar --replace-text secrets.txt tu-repo.git
```

**Salida que recibirás:**

```
Found 28 commits
Cleaning commits:       100% (28/28)
...
In total, 46 object ids were changed.
```

**¿Qué significa?**

- Revisó 28 commits
- Encontró secretos en 28 de ellos
- Reescribió los objetos git para remover los secretos

### Paso 5: Finalizar Limpieza

```bash
cd tu-repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**¿Para qué?**

- `git reflog expire` → Elimina referencias antiguas (reflogs)
- `git gc --prune=now` → "Garbage collect" - borra objetos que no se usan
- `--aggressive` → Optimización más fuerte

**Analógía:** Es como sacar la basura completamente, no solo en la superficie.

### Paso 6: Actualizar Repo Local

```bash
# En tu repo original (no el mirror)
git fetch "file://c:\Users\Usuario\Downloads\tu-repo.git" main
git reset --hard FETCH_HEAD
```

**¿Qué pasa?**

- Trae el historial limpio desde el mirror
- `reset --hard` reemplaza tu rama local con la versión limpia

### Paso 7: Force Push a GitHub

```bash
git push origin main --force
```

⚠️ **ADVERTENCIA IMPORTANTE:**

- `--force` NO es malo en este caso (es una limpieza legítima)
- Pero úsalo SOLO en casos de seguridad
- Avisa a tus colaboradores que hiciste rewrite de historial

**Salida:**

```
+ 2ab6109...58cc2ab main -> main (forced update)
```

Los hashes cambiaron (2ab6109 → 58cc2ab) porque el historial se reescribió.

### Paso 8: Cleanup

```powershell
Remove-Item -Recurse -Force tu-repo.git, secrets.txt
```

Limpia los archivos temporales.

---

## Verifiación: ¿Funcionó?

```bash
# Buscar si las credenciales aún existen en el historial
git log -p --all | Select-String -Pattern "SuperAdmin123|Secure@Admin2024"

# Si no outputs = ✅ Seguro
# Si tenga outputs = ❌ Las credenciales siguen en SECURITY.md o comentarios (es OK)
```

---

## Comparación: Antes vs Después

### ANTES (Inseguro)

```bash
$ git log -p
commit 687f2bf6...
  const password = "SuperAdmin123!";
  const apiKey = "sk_4dVkxbFDrcrXAqV7X-C0n";
```

❌ Credenciales expuestas públicamente

### DESPUÉS (Seguro)

```bash
$ git log -p
commit 58cc2ab...
  if (!process.env.SUPERADMIN_PASSWORD) {
    throw new Error("SUPERADMIN_PASSWORD requerida");
  }
  const password = process.env.SUPERADMIN_PASSWORD;
```

✅ Código seguro, historial limpio

---

## Resumen de 5 Fases

| Fase | Objetivo               | Herramienta             | Cuándo                       |
| ---- | ---------------------- | ----------------------- | ---------------------------- |
| 1    | Encontrar credenciales | `grep`, búsqueda manual | Incidente detectado          |
| 2    | Mover a env vars       | Editor de código        | Inmediatamente               |
| 3    | Proteger futuro        | `.gitignore`            | Con los commits de seguridad |
| 4    | Preparar limpieza      | `git clone --mirror`    | Antes de BFG                 |
| 5    | Limpiar historial      | **BFG Repo-Cleaner**    | Cuando código ya está seguro |

---

## Caso de Uso: ¿Cuándo Usar BFG?

### ✅ Usa BFG Cuando:

- Encontraste credenciales en commits antiguos
- Ya moviste las credenciales a variables de entorno (código seguro)
- El repo es público o pronto será público
- Las credenciales reales necesitan ser rotadas

### ❌ NO Necesitas BFG Cuando:

- Solo commiteaste `.env` para un commit
- Ya está en `.gitignore` correctamente
- Es un repo privado y confías en tu equipo

---

## Checklist de Seguridad Post-Incidente

```
☐ 1. Rotar credenciales reales en producción
     (En Prisma, DB, APIs, etc.)

☐ 2. Encontrar y remover credenciales del código
     (grep busca hardcodeadas)

☐ 3. Mover a variables de entorno
     (process.env, con validación)

☐ 4. Actualizar .gitignore
     (Agregar .env, secretos, files sensibles)

☐ 5. Limpiar historial con BFG
     (Si es público, si tiene credenciales)

☐ 6. Force push a GitHub
     (git push origin main --force)

☐ 7. Avisar al equipo
     (Explica qué pasó y cómo lo resolviste)

☐ 8. Documentar lecciones aprendidas
     (Crea SECURITY.md con guías)
```

---

## Lecciones Clave

### 1. Prevención es Mejor que Curación

```bash
# Desde el inicio, usa:
echo ".env" >> .gitignore
echo "*.pem" >> .gitignore
echo "**/secrets/*" >> .gitignore
```

### 2. Nunca Committees Credenciales

```typescript
// ❌ Nunca
const API_KEY = "sk_teste123456789";

// ✅ Siempre
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY requerida en .env");
```

### 3. Manten .env.example como Template

```bash
# .env.example (SIN valores reales)
DATABASE_URL=postgresql://...
API_KEY=sk_...
SECRET=your-secret-here
```

```bash
# .env (gitignore, solo local)
DATABASE_URL=postgresql://user:pass@localhost/db
API_KEY=sk_real_key_12345
SECRET=actual-secret-value
```

### 4. Git Log Nunca Perdona

Una vez commiteado, siempre quedará en el historialunless uses BFG/filter-branch

### 5. BFG Es Tu Amigo

```bash
# Conoce estos comandos:
git log --oneline -10              # Ver últimos 10 commits
git log -p archivo.ts              # Ver historial de un archivo
git show <commit>                  # Ver cambios de un commit
git reflog                         # Ver movimientos de HEAD

# Y cuándo usarlos:
# - Para auditar: git log -p
# - Para limpiar: BFG Repo-Cleaner
```

---

## Recursos Adicionales

- **BFG Docs:** https://rtyley.github.io/bfg-repo-cleaner/
- **Git Filter Branch:** `git help filter-branch`
- **GitHub Secret Scanning:** Habilita en Settings > Security

---

## En Tu Caso Específico

### Paso a Paso de lo Que Hicimos:

1. **Fase 1:** Encontramos 5 credenciales

   ```bash
   grep -r "SuperAdmin123" .
   grep -r "Secure@" .
   ```

2. **Fase 2:** Movimos a env vars
   - `create-super-admin.ts` → process.env.SUPERADMIN_PASSWORD
   - `seed.ts` → process.env.TEST_ADMIN_PASSWORD
   - Commits: 233f3d5, 71e6dc9, 2ab6109

3. **Fase 3:** Protegimos .gitignore

   ```
   .env*
   prisma/create-*.ts
   CREDENCIALES.md
   ```

   - Commits: ec54d9a, cb9f701

4. **Fase 4-5:** Limpiamos historial con BFG
   - Creamos secrets.txt con 5 credenciales
   - Ejecutamos BFG → Reescribió 28 commits
   - Force push a GitHub
   - Resultado: Historial completamente limpio ✅

### Verificación Final:

```bash
git log -p --all | grep -E "SuperAdmin|Secure@Admin|ClubAdmin"
# Resultado: Nada encontrado ✅
```

---

**Fin de la Guía.** Este es el proceso que usaste. Ahora sabes cómo hacerlo nuevamente si lo necesitas. 🔐
