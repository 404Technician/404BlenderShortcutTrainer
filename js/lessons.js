const step=(id,mission,keys,action,explanation='',extra={})=>({id,mission,keys,action,explanation,hints:[`Think about ${action.replaceAll('-', ' ')}.`,`Use ${keys.join(' → ')}.`,],...extra});
const transform=(id,mission,keys,action,explanation='',extra={})=>step(id,mission,keys,action,explanation,{modal:true,hints:[`Think about ${action==='duplicate'?'making a copy':action==='move'?'Grab / Move':action==='scale'?'scaling':action==='rotate'?'rotation':action}.`,extra.cancel?`Press ${keys.join(' → ')}, then Esc to cancel.`:`Press ${keys.join(' → ')}${extra.numeric?'':', adjust with your pointer or trainer arrow keys, then confirm with Enter'}.`],...extra});
export const lessons=[
 {title:'Look Around',intro:"Before we create anything, let's learn how to look around.",steps:[
 step('orbit','Drag with the middle mouse button.',['MMB drag'],'orbit','Hold your mouse wheel down and drag. Orbit changes your view, not the object.'),
 step('pan','Slide the view sideways.',['Shift + MMB drag'],'pan','Hold Shift and the middle mouse button, then drag.'),
 step('zoom','Get a little closer.',['Wheel'],'zoom','Scroll over the viewport. Your cube stays the same size in the scene.') ]},
 {title:'Move, Rotate & Scale',intro:"Three keys you'll use all the time. Start an action, adjust it, then confirm.",steps:[
 transform('move','Move the cube to a new position.',['G'],'move','Press G, move freely across the XY floor plane, then press Enter or left-click. This introductory trainer exercise keeps Z unchanged; unconstrained G in Blender follows the current view plane.',{freeXY:true}),
 transform('rotate','Turn the cube.',['R'],'rotate','R rotates around your current viewing direction. Move your pointer around the cube, then confirm.',{viewAligned:true}),
 transform('scale','Make the cube bigger.',['S'],'scale','S starts scaling. Move your pointer to the right, then confirm. Scaling changes your design.'),
 transform('cancel','Start moving, then cancel the change.',['G'],'move','Press G, then Esc or right-click. The cube returns to its previous position.',{cancel:true})]},
 {title:'Master the Axes',intro:'Precise movement helps parts line up. Commands are sequences, not key chords.',steps:[
 transform('gx','Move along the red X axis.',['G','X'],'move','Press G, release it, then press X. Adjust and confirm.',{axis:'x'}),
 transform('gy','Move along the green Y axis.',['G','Y'],'move','Y moves forward or backward across the floor.',{axis:'y'}),
 transform('gz','Move upward on Z.',['G','Z'],'move','Z is the vertical axis.',{axis:'z'}),
 transform('numeric','Move exactly two units upward.',['G','Z','2','Enter'],'move','This moves the object exactly two Blender units upward. Enter confirms.',{axis:'z',numeric:2}),
 transform('sx','Stretch the cube along X.',['S','X'],'scale','The same axis idea works with Scale.',{axis:'x'}),
 transform('rz','Rotate around Z.',['R','Z'],'rotate','And with Rotate. Think of Z as a vertical spindle.',{axis:'z'})]},
 {title:'Edit Your Model',intro:'Object Mode moves whole objects. Edit Mode changes their shapes!',steps:[
 step('edit','Enter Edit Mode.',['Tab'],'edit','The mesh becomes visible. Tab switches between Object and Edit Mode.'),
 step('vertices','Show the vertices.',['1'],'vertices','Use the number row. Vertices are the corner points.'),
 step('edges','Show the edges.',['2'],'edges','Edges connect the corners.'),
 step('faces','Switch to Face selection.',['3'],'faces','Faces are the surfaces between edges.'),
 step('top','Select the top face.',['LMB'],'top','Click the top surface before extruding. Keyboard alternative: Space selects it in this trainer only.'),
 transform('extrude','Extrude the top face upward.',['E'],'extrude','E starts Extrude Region. Move your pointer upward and confirm. This adds connected geometry.'),
 transform('inset','Make a small border on the top.',['I'],'inset','With the top face selected, I starts Inset Faces. Adjust the border and confirm.'),
 step('object','Return to Object Mode.',['Tab'],'object','Your first simple form! A printable mesh still needs real Blender checks.') ]},
 {title:'Everyday Blender Skills',intro:"A few everyday commands keep you moving. Let's practice them in context.",steps:[
 step('all','Select the cube.',['A'],'all','A selects all objects in Object Mode.'),
 step('none','Deselect everything.',['Alt + A'],'none','Hold Alt while pressing A. This is a combination.'),
 step('select','Select the cube with a click.',['LMB'],'select','Left-click selects with the default selection preference. Space is a trainer-only keyboard alternative.'),
 transform('duplicate','Make a second cube.',['Shift + D'],'duplicate','Hold Shift and press D. Duplication starts a Move operation; position the copy and confirm.'),
 step('delete','Delete the selected copy.',['X','Enter'],'delete','X opens a confirmation. Enter confirms deletion in Object Mode.'),
 step('undo','Bring the deleted copy back.',['Ctrl + Z'],'undo','Undo reverses your last modeling action.'),
 step('redo','Redo the deletion.',['Ctrl + Shift + Z'],'redo','Hold Ctrl and Shift while pressing Z.'),
 step('save','Practice saving your work.',['Ctrl + S'],'save','Practice only: this records a trainer save marker, not a .blend file.'),
 step('search','Open command search.',['F3'],'search','Search is useful when you know what you want to do but forget its shortcut. Try typing Extrude, then press Esc or close the example to continue.') ]},
 {title:"Tavi's First Model Challenge",intro:"You've got this. Make a small model using what you've learned. Hints are here when you need them.",steps:[
 transform('final-scale','Scale the cube into a bigger form.',['S'],'scale','Start the tool, adjust the shape, then confirm.'),
 step('final-edit','Enter Edit Mode.',['Tab'],'edit'),
 step('final-face','Switch to Face selection.',['3'],'faces'),
 step('final-top','Select only the top face.',['LMB'],'top','Click the top surface, or use Space as a trainer-only alternative.'),
 transform('final-extrude','Extrude the top upward.',['E'],'extrude','Adjust the height, then confirm.'),
 step('final-object','Return to Object Mode.',['Tab'],'object'),
 transform('final-copy','Duplicate your model.',['Shift + D'],'duplicate','Place the copy, then confirm.'),
 transform('final-x','Move the copy along X.',['G','X'],'move','Constrain the move, adjust, and confirm.',{axis:'x'}),
 step('final-save','Save your practice model.',['Ctrl + S'],'save','A simulated save. In Blender this saves your .blend project.') ]}
];
export const deck=[
 ['Navigation','MMB drag','Orbit','Rotate the view, not the object.','3D Viewport','orbit'],['Navigation','Shift + MMB drag','Pan','Slide your view across the scene.','3D Viewport','pan'],['Navigation','Wheel','Zoom','Move the view closer or farther.','3D Viewport','zoom'],['Navigation','Home','Frame All','Fit all visible objects into view.','3D Viewport','frame'],['Navigation','Numpad .','Frame Selected','Fit the selected object; optional numpad shortcut.','3D Viewport','frame'],
 ['Selection','LMB','Select','Select an object or mesh component.','Default left-click selection','select'],['Selection','A','Select All','Select all visible items.','Object / Edit Mode','all'],['Selection','Alt + A','Deselect All','Clear the selection.','Object / Edit Mode','none'],['Selection','Ctrl + I','Invert Selection','Swap selected and unselected items.','Object / Edit Mode','invert'],
 ['Transform','G','Move','Start moving, then confirm or cancel.','Object / Edit Mode','move'],['Transform','R','Rotate','Start rotating, then confirm or cancel.','Object / Edit Mode','rotate'],['Transform','S','Scale','Start scaling, then confirm or cancel.','Object / Edit Mode','scale'],['Transform','G → X / Y / Z','Constrain an axis','Start Move, then choose one axis. Also works with R and S.','Active transform','move'],['Transform','G → Z → 2 → Enter','Precise movement','Move two units up and confirm.','Object Mode','numeric'],['Transform','Enter / LMB','Confirm','Finish the current operation.','Active transform','confirm'],['Transform','Esc / RMB','Cancel','Cancel the active transform. Extrusion has a special caveat: see README.','Active transform','cancel'],
 ['Edit Mode','Tab','Toggle Edit Mode','Switch between object and mesh editing.','Mesh active in 3D Viewport','edit'],['Edit Mode','1 / 2 / 3','Selection modes','Number row: vertices, edges, faces.','Mesh Edit Mode','faces'],
 ['Modeling','E','Extrude Region','Add connected geometry from a selection.','Mesh Edit Mode; selected top face here','extrude'],['Modeling','I','Inset Faces','Create a border inside selected faces.','Mesh Edit Mode; face selected','inset'],
 ['Workflow','Shift + D','Duplicate','Duplicate selection, then position the copy.','Object / Edit Mode','duplicate'],['Workflow','X','Delete','Open deletion confirmation or a context menu.','Object / Edit Mode','delete'],['Workflow','Ctrl + Z','Undo','Reverse the last action.','Editing','undo'],['Workflow','Ctrl + Shift + Z','Redo','Repeat an undone action.','Editing','redo'],['Workflow','Ctrl + S','Save','Save a .blend project in Blender; simulated here.','Blender application','save'],['Workflow','F3','Search','Find a command by name.','Active editor context','search'],
 ['Workflow','H / Alt + H','Hide / Reveal','Hide selected items or reveal hidden ones. Bonus reference.','Object / Edit Mode','hide'],['Workflow','N / T','Sidebar / Toolbar','Toggle the viewport panels. Bonus reference.','3D Viewport','panels']
].map(([category,shortcut,name,description,context,action])=>({category,shortcut,name,description,context,action}));
