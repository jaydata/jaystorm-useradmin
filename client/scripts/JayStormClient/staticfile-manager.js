/**
 * Created with JetBrains WebStorm.
 * User: nochtap
 * Date: 9/2/12
 * Time: 4:37 PM
 * To change this template use File | Settings | File Templates.
 */
$data.JayStormUI.AdminModel.extend("$data.JayStormClient.StaticFileManager", {
    constructor: function () {
        console.log("UserManager context:" + this.getType().fullName + " starting");
        var self = this;
        self.show = function () {
            self.visible(true);

            var appid = self.application.currentApplication().appid;

            //alert(JSON.stringify(self.application.currentApplication()));
            var uploader1 = new qq.FileUploader({
                element: document.getElementById('file-uploader1'),
                action: '/fileUpload',
                params: { type: '1', appid: appid },
                debug: true,
                allowedExtensions: ['zip'],
                extraDropzones: [qq.getByClass(document, 'qq-upload-extra-drop-area1')[0]]
            });
            var uploader2 = new qq.FileUploader({
                element: document.getElementById('file-uploader2'),
                action: '/fileUpload',
                params: { type: '2', appid: appid },
                debug: true,
                allowedExtensions: ['zip'],
                extraDropzones: [qq.getByClass(document, 'qq-upload-extra-drop-area2')[0]]
            });

        };

        self.hide = function () {
            self.visible(false);

        }
        var removeFile = function(type){
            var appid = self.application.currentApplication().appid;

            var xhr = new XMLHttpRequest();
            xhr.open("POST", "removeFiles", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onerror = function () {
                alert("could not connect to dashboard.jaystack.net");
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        
                    } else {
                        alert("not ok (200) response from getAuthorization:" + xhr.responseText);
                    }
                }
            }
            xhr.send(JSON.stringify({appid: appid, type:type}));
        };
        self.removeStaticFiles = function(button) {
           removeFile(1);
        }
        self.removeJsFiles = function(button) {
            removeFile(2);
        }

    }
});