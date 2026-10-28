Project Overview: 2D Minimalist Arena Survival Game

1. Core Concept & Genre
I want to build a 2D web-based, top-down arena survival shooter (similar to the core mechanics of Vampire Survivors mixed with Geometry Wars). The visual style is strictly minimalist and geometric, where all entities (player and enemies) are represented by circles.

2. Controls & Interactions

Movement: The player moves around the 2D arena using the W, A, S, D keys.

Aiming: The player's weapon aims dynamically. The aim direction is constantly locked onto the current position of the mouse cursor relative to the player's circle.

Combat: Shooting is completely automatic. The weapon fires projectiles at a consistent fire rate in the direction the mouse is pointing, without requiring mouse clicks.

3. Enemy & Gameplay Loop

Enemy Spawning: Enemies (also represented by circles, perhaps in different colors) spawn continuously from all edges of the screen/arena (top, bottom, left, right).

Enemy Behavior: The sole objective of the enemies is to move directly toward the player's current position to deal damage or kill the player on contact.

Goal: The player's objective is to survive as long as possible by dodging enemies and letting the automatic fire destroy them before they reach the player.

4. Technical Stack & Architecture

Platform: Web-based.

Rendering: HTML5 Canvas API for smooth 2D rendering and performance.

Framework: ReactJS to handle the application wrapper, UI overlays (like start screen, score, game over state), and overarching game state management.

Deployment: Set up the project structure so it is ready for seamless cloud deployment via Vercel.
