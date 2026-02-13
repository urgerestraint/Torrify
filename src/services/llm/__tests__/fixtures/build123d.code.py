from build123d import *

with BuildPart() as part:
    Box(20, 30, 5)

result = part.part
