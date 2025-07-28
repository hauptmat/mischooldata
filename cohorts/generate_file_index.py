import os
import json

DATA_DIR = 'data'
output = []

for filename in os.listdir(DATA_DIR):
    if filename.endswith('.csv'):
        parts = filename.replace('.csv', '').split('_')
        year = parts[0]
        subject = parts[-1]
        district = ' '.join(parts[1:-1])
        output.append({
            'filename': filename,
            'year': year,
            'district': district,
            'subject': subject
        })

# Save to data/files.json
with open(os.path.join(DATA_DIR, 'files.json'), 'w') as f:
    json.dump(output, f, indent=2)

print(f"Indexed {len(output)} files into data/files.json")
