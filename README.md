Gears
===
Generic Educational Robotics Simulator

This simulator was created to allow anyone to experiment with robotics without owning a robot.

Try it out at https://gears.aposteriori.com.sg

...or the latest version from github https://quirkycort.github.io/gears/public/

It uses the Ev3dev api (...and some early support for Pybricks), so the code can run on an actual Lego Mindstorm EV3 if you have one.

Installation
---

The simulator is meant to be served through a webserver.
Download all files and put them in a directory on your server and that should be it.
Due to CORS protection on web browsers, it will not work when served from a "file://" URL.

If you have Python3 installed on your computer, you can try changing to the gears directory and running...

`python -m http.server 1337`

This should get the site running on http://localhost:1337 (...try http://127.0.0.1/1337 if that doesn't work).
Do not close the window with the Python command running.

Credits
---
Created by A Posteriori (https://aposteriori.com.sg).

This simulator would not have been possible without the great people behind:

* Babylon.js https://babylonjs.org
* Skulpt https://skulpt.org
* Ace https://ace.c9.io
* EV3DEV https://ev3dev.org

License
---
GNU General Public License v3.0

The following Open Source software are included here for convenience.
Please refer to their respective websites for license information.

* Babylon.js
* Blockly
* Ace Editor
* Skulpt
* Ammo.js
* Cannon.js
* Oimo.js
* Pep
* Jquery
