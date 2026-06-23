import re

with open(r'C:\Users\minfe\Documents\Codex\rootwords-uni\src\utils\data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Check the exact ending
print("Last 100 chars:", repr(content[-100:]))

# Find the last occurrence of "export default DATA"
idx = content.rfind("export default DATA")
print(f"\nIndex of 'export default DATA': {idx}")
print(f"Before: {repr(content[idx-10:idx])}")
print(f"After: {repr(content[idx+len('export default DATA'):idx+len('export default DATA')+10])}")
