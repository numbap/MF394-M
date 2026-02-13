The Add and Edit pages will be very similar. 

The main difference is that the Edit page will prepopulate with details from an existing contact, and have a delete button to delete that contact. The Add page will not offer deletion since there is no existing contact yet. 

On Save, the contact will either be updated or added to the user's account. The app should work locally, and update the APIs when it gets online. So some cacheing will be necessary. 

Any changes made in the Add or Edit screens are only applied locally, and not implemented until the user saves. For example, if the user deletes an image from a contact and then exits before saving, that image will not be deleted. 

Saving a contact causes the modal to close, and the user returns to the homepage. 

The Add and Edit flows follow the same steps.

Delete Image > Cancel - No changes made
Change form items or tags / categories > Cancel - No changes made
Add image > Select Face > User clicks on a face - User returns to Add/Edit screen with selected image in the image element. 
Add image > Select Face > User clicks the Back button - User returns to Add/Edit screen without updating the image element. 
Add image > Select Face > Crop - User redirected to cropping interface
Add image > Select Face > Crop > User clicks Back button - User redirected to Add/Edit screen wihtout updating image element
Add Image > Select Face > Crop > Apply - User redirected to Add/Edit screen, with cropped image in the image element. 
Add Image > No Faces Fond - Will automatically redirect to the cropping interface, and will continue as usual.
Add Image > User selects invalid file - Will throw an error and user will return to Add/Edit 
User Add Name, but no image or Hint - Save button shold be disabled. User cannot save or add a contact unless it has both 1) a name and 2) either an image or a hint
User adds an image but no name - Save button shold be disabled.
User add a hint but no name - save btton should be disabled

User can select any category or tags they want. All tags shold be visible. And there shold be a button to load the Edit Tags interface. The Edit Tagds interface shouls load inline with the modal. 

Edit Tags > Cancel - User Returns to Add/Edit screen. 

Delete button should not appear when adding a contact. 

The form should be from a common form component. To ensure consistency and reusability. 
The Tags + Category filter should be from a common component. To ensure consistency and reusability. 
The section at the bottom with the buttons should be from a common component. To ensure consistency and reusability. 


