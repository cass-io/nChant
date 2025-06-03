import kaboom from "kaboom";


const FLOOR_HEIGHT = 90;
const JUMP_FORCE = 450;
const SPEED = 400;
const TILE_SIZE = 64;

// initialize context
kaboom();

// load assets
loadSprite("player", "sprites/playersprite.png", {
    sliceX: 6,
    sliceY: 2,
    anims: {
        "idle": { from: 4, to: 11, speed: 5, loop: true },
        "walk": { from: 0, to: 3, speed: 5, loop: true},    
    },
    
});
loadSprite("emeraldNode", "sprites/emeraldNode.png");
loadSprite("bgImg", "sprites/bgImg.png"); 
loadSprite("firearrow", "sprites/firearrow.png");
loadSprite("grasstile", "sprites/grasstile.png");

scene("game", () => {

    // define gravity
    setGravity(1000);

    // Add the background first
    add([
        sprite("bgImg"),
        pos(0, -FLOOR_HEIGHT),
        scale(1),
        fixed(),
    ]);

    const level1 = [
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "================================",
    ];

    const levelConf = {
        tileWidth: TILE_SIZE,
        tileHeight: TILE_SIZE,
        tiles: {
            "=": () => [
                sprite("grasstile"),
                area(),
                body({isStatic: true}),
                anchor("botleft"),
                "floor",
                scale(2),
            ],
        },
    };

    const level = addLevel(level1, levelConf);

    // add player to screen
    const player = add([
        // list of components
        sprite("player", { anim: "idle" },),
        pos(80, 40),
        area(),
        body(1),
        scale(0.25)
    ]);

    // Camera follow player
    player.onUpdate(() => {
        camPos(player.pos.x, player.pos.y);
        // Keep the camera in bounds
        const camX = Math.max(0, Math.min(width(), player.pos.x));
        const camY = Math.max(0, Math.min(height(), player.pos.y));
        camPos(camX, camY);
    })

    /* floor
    add([
        rect(width(), FLOOR_HEIGHT),
        pos(0, height()),
        anchor("botleft"),
        area(),
        body({ isStatic: true }),
        "floor",
        z(1),
        color(50, 150, 133)
    ]);
    */

    // define doublejump variable
    let doubleJumps = 0;

    // reset doublejump on floor collision
    player.onCollide("floor", () => {
        doubleJumps = 0;
    });

    // define jump function, increment jumps spent prior to landing
    function jump() {
        if (doubleJumps <= 2)
        {
            player.jump(JUMP_FORCE);
            doubleJumps++;
        }
    }

    // jump when user press space
    onKeyPress("space", jump);


//e for firearrow
onKeyPress("k", () => {
    // Calculate the starting position of the firearrow relative to the player
    const arrowX = player.pos.x + (player.flipX ? -20 : player.width / 4); // Adjust for player direction and size
    const arrowY = player.pos.y + player.height / 9; // Adjust to roughly the player's arm level

    // Determine the direction of the arrow based on player's flipX
    const arrowSpeed = player.flipX ? -800 : 800; // Shoot left or right

    // Assign the newly created firearrow object to a variable
    const firearrow = add([ // <--- Assign the result of add() to 'firearrow'
        sprite("firearrow"),
        pos(arrowX, arrowY), // Use the calculated position
        area(), // Add body for physics if needed for collisions with other objects
        move(RIGHT, arrowSpeed), // Make the arrow move. If flipX is true, it will move LEFT due to negative speed.
        offscreen({ destroy: true }), // Destroy the arrow when it leaves the screen
        scale(1),
        "firearrow", // Add a tag for potential future collisions
    ]);

    // Now you can access and modify the 'flipX' property of the 'firearrow' object
    firearrow.flipX = player.flipX;
});


    // Implement lateral movement
    onKeyDown("a", () => {
        player.move(-SPEED, 0);
        if (player.curAnim() !== "walk") {
            player.play("walk");
        }
    });

    onKeyDown("d", () => {
        player.move(SPEED, 0);
        if (player.curAnim() !== "walk") {
            player.play("walk");
        }
    });


    // stop walking
    onKeyRelease("d", () => {
        if (player.curAnim() == "walk") {
            player.play("idle");
        }
    });
    onKeyRelease("a", () => {
        if (player.curAnim() == "walk") {
            player.play("idle");
        }
    });

    // Flip player sprite (only when key is initially pressed)
    onKeyPress("a", () => {
        player.flipX = true;
    });

    onKeyPress("d", () => {
        player.flipX = false;
    });

    /* Function to spawn emerald deposits
    function spawnEmeralds() {
        add([
            sprite("emeraldNode"),
            // area() without arguments will use sprite's dimensions (scaled)
            area(), // Changed from area(100) to auto-detect area
            pos(width(), height() - FLOOR_HEIGHT),
            anchor("botleft"),
            move(LEFT, SPEED),
            scale(rand(1.5, 2.5)),
            // Removed body(1) from emeraldNode if it's just an obstacle,
            // as it conflicts with manual 'move' and can cause physics issues.
            // If you need physics on it, you'll need to manage its velocity
            // through the physics engine rather than direct 'move'.
            "emeraldNode",
        ]);

        wait(rand(3, 5), spawnEmeralds);
    }
    

    // Start spawning emeralds (Corrected call)
    wait(rand(3, 5), spawnEmeralds); // Removed parentheses from spawnEmeralds
    */

    // --- Emerald Mining Logic (Corrected) ---
    let currentEmerald = null; // To store the emerald the player is currently colliding with

    player.onCollide("emeraldNode", (emerald) => {
        currentEmerald = emerald; // Set the current emerald when collision occurs
    });

    // When the player stops colliding with an emerald
    player.onCollideEnd("emeraldNode", () => {
        currentEmerald = null; // Clear the current emerald
    });

    onKeyPress("f", () => {
        if (currentEmerald) { // Check if there's an emerald to mine
            debug.log("Collided with emerald and 'f' pressed. Destroying:", currentEmerald);
            destroy(currentEmerald);
            score++;
            scoreLabel.text = score;
            currentEmerald = null; // Clear it after mining so it can't be mined again
        }
    });
    // --- End Emerald Mining Logic ---

    // lose if player collides with any game obj with tag "tree"
    player.onCollide("tree", () => {
        // go to "lose" scene and pass the score
        go("lose", score);
        burp(); // Make sure 'burp' is defined or remove if not needed
        addKaboom(player.pos); // Make sure 'addKaboom' is defined or remove if not needed
    });

    // keep track of score
    let score = 0;

    const scoreLabel = add([
        text(score),
        pos(24, 24),
    ]);
});

scene("lose", (score) => {

    add([
        sprite("player"),
        pos(width() / 2, height() / 2 - 80),
        scale(2),
        anchor("center"),
    ]);

    // display score
    add([
        text(score),
        pos(width() / 2, height() / 2 + 80),
        scale(2),
        anchor("center"),
    ]);


    // go back to game with space is pressed
    onKeyPress("space", () => go("game"));
    onClick(() => go("game"));

});

go("game");
