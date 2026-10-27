n = int(input())

commands = []

for _ in range(n):
    existing, new, direction = input().split()
    commands.append((int(existing), int(new), direction.lower()))

# Sort by existing cube number, then new cube number
commands.sort(key=lambda x: (x[0], x[1]))

# Cube number -> (x, y)
pos = {}

# Position -> cube number
grid = {}

# Direction changes
dx = {
    "left": -1,
    "right": 1,
    "top": 0,
    "down": 0
}

dy = {
    "left": 0,
    "right": 0,
    "top": 1,
    "down": -1
}

# Process commands
for existing, new, direction in commands:

    # Existing cube should already have a position
    if existing not in pos:
        # In case the first command does not contain cube 1
        if not pos:
            pos[existing] = (0, 0)
            grid[(0, 0)] = existing

    x, y = pos[existing]

    new_x = x + dx[direction]
    new_y = y + dy[direction]

    # If a cube already exists at this position,
    # the new cube replaces it.
    if (new_x, new_y) in grid:
        old_cube = grid[(new_x, new_y)]

        if old_cube in pos:
            del pos[old_cube]

    pos[new] = (new_x, new_y)
    grid[(new_x, new_y)] = new

# Required cube
target = int(input())

x, y = pos[target]

# Up, Down, Left, Right
neighbors = [
    (x, y + 1),  # Up
    (x, y - 1),  # Down
    (x - 1, y),  # Left
    (x + 1, y)   # Right
]

answer = []

for p in neighbors:
    answer.append(str(grid.get(p, -1)))

print(" ".join(answer))