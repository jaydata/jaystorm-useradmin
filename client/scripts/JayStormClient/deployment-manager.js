/**
 * Created with JetBrains WebStorm.
 * User: nochtap
 * Date: 9/2/12
 * Time: 4:37 PM
 * To change this template use File | Settings | File Templates.
 */
$data.JayStormUI.AdminModel.extend("$data.JayStormClient.DeploymentManager", {
    constructor: function () {
        console.log("UserManager context:" + this.getType().fullName + " starting");
        var self = this;
        self.show = function () {
            self.visible(true);
            alert(JSON.stringify(self.application.currentApplication()));
            var uploader1 = new qq.FileUploader({
                element: document.getElementById('file-uploader1'),
                action: '/fileUpload',
                params: { type: '1' },
                debug: true,
                allowedExtensions: ['zip'],
                extraDropzones: [qq.getByClass(document, 'qq-upload-extra-drop-area1')[0]]
            });
            var uploader2 = new qq.FileUploader({
                element: document.getElementById('file-uploader2'),
                action: '/fileUpload',
                params: { type: '2' },
                debug: true,
                allowedExtensions: ['zip'],
                extraDropzones: [qq.getByClass(document, 'qq-upload-extra-drop-area2')[0]]
            });
        };

        self.hide = function () {
            self.visible(false);

        }


    }
});