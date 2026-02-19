This interface allows users to manually crop an uploaded image. 

There is a slider to change the size, and the user can drag the image around in the cropping window. 

Pressing cancel will bring the user back to the previous steps in their current workflow without selecting an image. 
Pressing "Crop" will crop the image and use it as the selected image in the current workflow. 

It is used in the Add and Edit flows. 


The cropper CropArea should span the entire screen width. This will be a 1x1 square cropper. It should not take up the entire height of the screen. 
No + and - buttons. Only a slider to control size. 
The image can be positioned by dragging it around and by pinching to zoom. 

The save and cancel buttons should be below the cropper. And should have icons. 

Do not show image statistics, pixel sizes or percentages in the cropper. 

Hitting the save button returns the base64 cropped image to the main form of the Add or Edit flow that called it, to be used as the thumbnail. 

The cropper should use React-Easy-Crop. 

Default zome should be 200%