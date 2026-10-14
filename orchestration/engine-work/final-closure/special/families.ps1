$ErrorActionPreference='Stop'
& node orchestration/engine-work/final-closure/special/families.mjs
if($LASTEXITCODE -ne 0){throw 'Family export/Word proof failed'}
