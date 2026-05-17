import os
import re

files = [
    "src/routes/_authenticated/community-hub.index.tsx",
    "src/components/community/PostCard.tsx",
    "src/components/community/AnnouncementCard.tsx",
    "src/components/community/CommentSection.tsx",
    "src/components/community/CommunitySidebar.tsx",
    "src/components/community/CreatePostForm.tsx",
    "src/routes/_authenticated/community-hub.$postId.tsx",
    "src/routes/_authenticated/admin-dashboard.announcements.tsx",
    "src/routes/_authenticated/admin-dashboard.community-posts.tsx"
]

components = [
    "Card", "CardContent", "CardHeader", "CardTitle", "CardDescription", "CardFooter",
    "Button", "Avatar", "AvatarFallback", "AvatarImage", "Badge", "Dialog", "Textarea", "Input",
    "ScrollArea", "Separator", "Tabs", "TabsContent", "TabsList", "TabsTrigger", "DropdownMenu",
    "DropdownMenuContent", "DropdownMenuItem", "DropdownMenuLabel", "DropdownMenuSeparator", "DropdownMenuTrigger",
    "Skeleton"
]

def check_file(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r') as f:
        content = f.read()

    used = []
    for comp in components:
        if re.search(rf'<{comp}[\s/>\.]', content):
            used.append(comp)

    # Find all imported names
    imported = []
    # Match imports like: import { A, B } from '...'
    matches = re.finditer(r'import\s*\{([^}]*)\}\s*from\s*[\'"]([^\'"]*)[\'"]', content, re.DOTALL)
    for match in matches:
        names_part = match.group(1)
        names = [n.strip().split()[-1] for n in names_part.split(',') if n.strip()]
        imported.extend(names)

    # Match default imports like: import A from '...'
    default_matches = re.finditer(r'import\s+([a-zA-Z0-9_]+)\s+from\s*[\'"]([^\'"]*)[\'"]', content)
    for match in default_matches:
        imported.append(match.group(1))

    missing = [comp for comp in used if comp not in imported]
    if missing:
        print(f"--- {file_path} ---")
        print(f"Used: {used}")
        print(f"Imported: {imported}")
        print(f"Missing: {missing}")

for f in files:
    check_file(f)
