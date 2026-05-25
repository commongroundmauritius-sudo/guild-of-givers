import os
import re

def cleanup_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Pattern to match nested DO blocks created by the previous script
    # DO 3239 BEGIN IF EXISTS ... THEN DO 3239 BEGIN IF EXISTS ... THEN ... END IF; END 3239; END IF; END 3239;

    # We want to flatten this:
    # DO 3239 BEGIN IF EXISTS (X) THEN ... IF EXISTS (X) THEN ... END IF; ... END IF; END 3239;

    # More simply, let's just use a regex to find the inner DO 3239 ... END 3239; and remove the DO tags if the condition is the same.
    # But since I know I made a mess, let's just try to fix common patterns.

    # Strategy: Replace 'THEN\nDO $$\nBEGIN\n    IF EXISTS' with 'THEN\n    IF EXISTS'
    # and replace '    END IF;\nEND $$;\n    END IF;' with '    END IF;\n    END IF;'

    # 1. Remove inner DO 3239 BEGIN and matching END 3239;
    new_content = content

    # Flatten specific redundant pattern
    pattern = re.compile(r'IF EXISTS \(SELECT 1 FROM information_schema\.tables WHERE table_schema = '\''public'\'' AND table_name = '\''(\w+)'\''\) THEN\nDO $$\nBEGIN\n    IF EXISTS \(SELECT 1 FROM information_schema\.tables WHERE table_schema = '\''public'\'' AND table_name = '\''\1'\''\) THEN', re.MULTILINE)
    new_content = pattern.sub(r'IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'\1\') THEN', new_content)

    # Clean up the trailing END 3239;
    # This is trickier because of the END IF; nesting.
    # We'll just look for 'END IF;\nEND $$;\n    END IF;' and replace with '    END IF;'
    new_content = new_content.replace('    END IF;\nEND $$;\n    END IF;', '    END IF;')

    # 2. Fix the specific case of double indentation/nesting in 20260521182626
    # (Actually manual fix might be safer for complex files)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Cleaned {filepath}")

for root, dirs, files in os.walk('supabase/migrations'):
    for file in files:
        if file.endswith('.sql'):
            cleanup_file(os.path.join(root, file))
