![WebGL Cubes](http://cattopus23.com/img/panel-CAT826.png)

CAT826 Sunflow Filemaker
========================

Takes webcam input, turns it into 3D cubes, outputs Sunflow scene files that can be rendered into images that look like this...

![Example cubes](https://raw.github.com/revdancatt/CAT826-sunflow-filemaker/master/img/example.jpg)

...to do the same thing you will need...

1. Latest version of Chrome that runs WebGL.
2. A webcam.
3. A simple text editor.
4. A copy of [Sunflow](http://sunflow.sourceforge.net/).
5. Patience.

Blogpost, more information: [CAT826: The one with the cubes, javascript in the rendering tools chain.](http://revdancatt.com/2013/06/10/cat826-the-one-with-the-cubes-javascript-in-the-rendering-tools-chain)

Instructions
============

Point your browser here: http://revdancatt.github.io/CAT826-sunflow-filemaker/ and accept the prompt to access the webcam.

The view from your webcam should appear in the top-right corner and a 3D cube version of that view will appear on the "stage".

![Step 1](https://raw.github.com/revdancatt/CAT826-sunflow-filemaker/master/img/step1.jpg)

Use the controls to move the camera around the cubes until you get the view you want ([read here](http://revdancatt.com/2013/06/10/cat826-the-one-with-the-cubes-javascript-in-the-rendering-tools-chain/#weirdcontrols)) if you
want to know why the controls are a bit odd. Once you're happy press 'R' a dialog box asking you to click a link should appear...

![Step 2](https://raw.github.com/revdancatt/CAT826-sunflow-filemaker/master/img/step2.jpg)

...once clicked a new tab will open with a Sunflow scene description, select all and copy & paste it into a simple text
editor. Then save as something like myscene.sc.

Fire up Sunflow, probably using something like...

java -Xmx1G -jar /Applications/sunflow/sunflow.jar

...the open the scene file from File | Open...

Click the render button.

![Step 3](https://raw.github.com/revdancatt/CAT826-sunflow-filemaker/master/img/step3.jpg)

Share and Enjoy.

![Final image](https://raw.github.com/revdancatt/CAT826-sunflow-filemaker/master/img/final.jpg)

Isn't this all a bit of a faff?
===============================

Yes, but to be fair it's just a side project from a bigger project that involves having Sunflow running on
a server and tied into the workflow, (and having JavaScript create a preview scenes that then get high
quality renders).

This is less faffing than asking someone to set that up, and I'm totally not going to run
Sunflow as a service (which is a shame tbh).

This blogpost: http://revdancatt.com/2013/06/10/cat826-the-one-with-the-cubes-javascript-in-the-rendering-tools-chain/ explains more.



