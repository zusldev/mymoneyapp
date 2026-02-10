# GitHub Standard

Este documento define el estandar oficial de trabajo en GitHub para este proyecto.

Objetivos:

- Consistencia entre contributors.
- Trazabilidad de cambios.
- Seguridad en produccion.
- Alta legibilidad tecnica.

## 1) Modelo de ramas (GitFlow)

Ramas principales:

- `main`: produccion estable.
- `develop`: integracion continua de trabajo diario.

Ramas de trabajo:

- `feature/<scope>-<short-description>`
- `hotfix/<scope>-<short-description>`
- `release/vX.Y.Z`

Reglas:

- Features salen de `develop` y vuelven a `develop`.
- Hotfixes salen de `main` y vuelven a `main`.
- Todo hotfix mergeado en `main` debe sincronizarse a `develop`.
- Releases salen de `develop`, se estabilizan, y luego se mergean a `main` (y de vuelta a `develop` si aplica).

## 2) Gate de autorizacion (obligatorio)

Antes de iniciar fase de publicacion, se requiere autorizacion explicita del responsable.

Fase de publicacion incluye:

- `git add`
- `git commit`
- `git push`
- `gh pr create`
- `gh pr merge`
- `gh release create`

Sin esta autorizacion, solo se permite analisis, implementacion local y validacion local.

## 3) Convencion de commits

Formato: Conventional Commits.

Tipos permitidos:

- `feat`
- `fix`
- `hotfix`
- `refactor`
- `test`
- `docs`
- `chore`
- `ci`
- `perf`

Ejemplos:

- `feat: agregar filtro por estrategia`
- `fix: corregir calculo de profit factor en stats summary`
- `hotfix: evitar crash en analytics por null toFixed`

Reglas:

- 1 intencion por commit.
- Mensaje claro, en imperativo, <= 72 chars en subject.
- No mezclar refactor grande con fix urgente en el mismo commit.

## 4) Estandar de Pull Request

Todo PR debe incluir:

- Resumen de problema y solucion.
- Alcance tecnico (archivos/modulos impactados).
- Riesgo y plan de rollback.
- Evidencia de pruebas.
- Referencia a issue/ticket (si existe).

Checklist minimo:

- Lint, tests y build locales en verde.
- Sin secretos ni credenciales.
- Tests nuevos para logica critica o cambios de calculo.
- Documentacion actualizada cuando cambia comportamiento.

## 5) Politica de merges

Reglas:

- No mergear con checks fallando.
- No mergear PR sin descripcion tecnica suficiente.
- Evitar merge directo a `main` excepto hotfix administrado.

Estrategia recomendada:

- PR de feature/hotfix: `Squash and merge` o `Merge commit` segun necesidad de trazabilidad.
- PR de release: `Merge commit` para preservar contexto de release.

## 6) Branch protection (configurar en GitHub)

Para `main`:

- Require pull request before merging.
- Require status checks to pass:
  - CI `lint-build`
  - checks de deploy requeridos (si aplica entorno productivo).
- Restrict direct pushes.
- Require linear history (opcional segun estrategia de merge).

Para `develop`:

- Require pull request before merging.
- Require CI checks.
- Bloquear force-push para contributors normales.

## 7) Calidad y validacion local

Comandos obligatorios antes de PR:

- `npm run lint`
- `npm test`
- `npm run build`

Si no se puede ejecutar alguno, el PR debe explicarlo con motivo tecnico.

## 8) Politica de release (SemVer)

Versionado:

- `MAJOR`: cambios incompatibles.
- `MINOR`: funcionalidades backward-compatible.
- `PATCH`: bugfix/hotfix.

Cadencia recomendada:

- Release regular: semanal o quincenal (`MINOR`/`PATCH`).
- Hotfix critico de calculo/riesgo: en <24h (`PATCH`).

Checklist de release:

- PR de release/hotfix mergeado en `main`.
- Tag `vX.Y.Z`.
- Release notes claras:
  - Que cambio.
  - Impacto para usuarios.
  - Riesgos y mitigaciones.
  - Validaciones ejecutadas.

## 9) Seguridad y cumplimiento

- Nunca subir tokens, secretos o datos sensibles.
- Revisar diffs de `.env`, logs, screenshots y exports.
- Usar Principle of Least Privilege para permisos de GitHub Actions.

## 10) Responsabilidades

Autor del cambio:

- Implementar y validar.
- Documentar impacto y riesgos.
- Responder feedback de review.

Reviewer:

- Verificar exactitud tecnica y riesgo.
- Confirmar calidad de tests.
- Validar que el cambio sigue este estandar.
