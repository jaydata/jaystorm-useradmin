/**
 * Created with JetBrains WebStorm.
 * User: peterzentai
 * Date: 8/20/12
 * Time: 12:09 PM
 * To change this template use File | Settings | File Templates.
 */

(function($data) {
var templateList = [
    ["jay-data-grid",
        "<form data-bind='submit:save'>\
            <div data-bind='visible: source' class='action-buttons'>\
                <span class='iblock'>\
                    <!-- ko if: showNewCommandTop && itemCount() > 7-->                             \
                    <a class='btn btn-info' href='#' data-bind='click: addNew'><i class='icon-plus icon-white'></i><span data-bind='text: newCommandCaption'></span></a> \
                     <!-- /ko --> \
                    <!-- ko if: showRemoveAllCommand && (itemCount() > 3) -->                             \
                    <a class='btn btn-danger' href='#' data-bind='click:removeAll'><i class='icon-trash icon-white'></i> Remove all</a>\
                     <!-- /ko --> \
                    <input class='btn btn-success' type='submit' value='Save' data-bind='visible: pendingChanges() && itemCount() > 7' />\
                </span>\
                <span data-bind=\"if: showSort\" class='iblock pull-right'>\
                    <span class='title'>Sort:</span><select class='input-medium' data-bind='options: columns, optionsValue: \"name\", optionsText: \"name\", value: sortColumn'></select>\
                </span>\
            </div>\
            <table data-bind='visible: source' class='jay-data-grid table table-bordered table-hover' border='0'> \
                <!-- ko template: { name: 'jay-data-grid-head' } --> \
                <!-- /ko -->\
                <!-- ko template: { name: 'jay-data-grid-body' } --> \
                <!-- /ko -->\
            </table>\
                <div data-bind='visible: source' class='action-buttons'>\
                    <span class='iblock'>\
                        <!-- ko if: showNewCommandBottom -->  \
                        <a class='btn btn-info' href='#' data-bind='click: addNew'><i class='icon-plus icon-white'></i> <span data-bind='text: newCommandCaption'></a> \
                        <!-- /ko -->\
                        <input class='btn btn-success' type='submit' value='Save' data-bind='visible: pendingChanges'/>\
                    </span>\
                    <br />\
                    <span class='iblock margint10'>\
                        <select class='input-small' data-bind='options: [10,20,50,100], value: pageSize, visible: itemCount() > 10'></select>\
                        <span data-bind='visible: pendingChanges, text: pendingStatusInfo()' />\
                    </span>\
                    <!-- ko if: pages().length > 1 -->\
                    <div  class='pagination pagination-centered'>\
                        <ul>\
                        <li><a href='#' data-bind='click:goToPreviousPage'>&#171;</a>\
                        </li>\
                        <li><select class='input-mini' data-bind='options: pages, value: currentPage'></select></li>\
                        <li><a href='#' data-bind='click:goToNextPage'>&#187;</a></li>\
                        </ul>\
                    </div>\
                    <!-- /ko -->\
                </div>\
            </form>"],

    ["jay-data-grid-head",
        "<thead class='jay-data-grid-columns'>\
           <tr class='jay-data-grid-columns-row' \
           data-bind=\"template: { name: 'jay-data-grid-header-cell', foreach: columns}\"\
           </tr>\
        </thead>"],


    ["jay-data-grid-body",
        "<tbody data-bind=\"template: {name: 'jay-data-grid-row', foreach: items}\"></tbody>"],

    ["jay-data-grid-row",
        "<tr  data-bind='foreach: $data.getColumns($index) '>\
            <!-- ko template: { name: (metadata[\"type\"] === \"itemCommands\" ? 'jay-data-grid-control-cell' : 'jay-data-grid-data-cell') } -->\
            <!-- /ko -->\
        </tr>\
        <tr data-bind='foreach: getControlCells'>\
            <td data-bind='attr: { colspan: colspan }, template: { name: templateName, data: viewModel }'></td>\
        </tr>\
        "],


    ["jay-data-grid-data-cell",
        "<td data-bind='template: $data.metadata[\"$template\"] ? $data.metadata[\"$template\"] : $root.getTemplate($data.owner,$data.metadata,$data.Model), style:{ width: $data.metadata[\"$width\"]}'></td>"],


//    visible: visible($parents[1]), \
//    click: $data.execute, \
    //<span data-bind='with: $parent'>\
    //</span>\
    ["jay-data-grid-control-cell",
        "<td>\
            <div  data-bind='foreach: itemCommands'>\
                <a href='#' class='btn' data-bind='click: execute.bind($data,$parents[1]), \
                                       visible: visible.call($data,$parents[1]), text: displayName'></a>\
            </div>\
        </td>"],

    ["jay-data-grid-header-cell",
        "<th data-bind='text: $data[\"$displayName\"] || name'></th>"],

    ["jay-data-grid-generic-display",
        "<span data-bind='text: value'></span>"],

    ["jay-data-grid-bound-field-display",
        "<span data-bind='readValue: { source: $root.context()[metadata[\"$sourceTable\"]], \
                                        key: owner[metadata[\"$sourceKey\"]], \
                                        field: metadata[\"$sourceDisplay\"] }'></span>"],

    ["jay-data-grid-bound-field-editor",
        "<a href='#' class='btn' data-bind='click: function(){ value(null); }'>Clear</a>\
        <select data-bind='options: $root.context()[metadata[\"$sourceTable\"]].toKoArray(value, this),\
                            value: value,\
                            optionsText: metadata[\"$sourceText\"] || metadata[\"$sourceDisplay\"],\
                            optionsValue: metadata[\"$sourceValue\"] || metadata[\"$sourceKey\"],\
                            optionsCaption: \"Select...\",\
                            optionsCaptionValue: null'></select>"],

    ["jay-data-grid-$data.Boolean-display",
        '<input type="checkbox" data-bind="checked: value" disabled />'],

    ["jay-data-grid-$data.String-display",
        '<span data-bind="text: value"></span>'],

    ["jay-data-grid-$data.Array-display",
        '[<span data-bind="foreach: value"><span data-bind="text:$data"></span></span>]'],

    ["jay-data-grid-generic-editor",
        '<input type="text" data-bind="value: value, attr: { placeholder: metadata.hint, required: metadata.required, pattern: metadata[\'$RegExp\'] ? metadata[\'$RegExp\'].slice(1, -1) : null }" />'],

    ["jay-data-grid-$data.Boolean-editor",
        '<input type="checkbox" data-bind="checked: $parent[name]"  />'],

    ["jay-data-grid-Edm.String-editor",
        "<input type='text' data-bind='value: value, attr: { required: metadata[\"required\"], pattern: metadata[\'$RegExp\'] ? metadata[\'$RegExp\'].slice(1, -1) : null }, css: { verror: owner.ValidationErrors }' />" ],

    ["jay-data-grid-Edm.Int32-editor",
        "<input type='range' min=1 max=10 \
            data-bind='value: value, attr: { required: $data[\"required\"] }, css: { verror: owner.ValidationErrors }' />"],


    //
    ["jay-data-grid-$data.Integer-default-editor",
        "<input type='number' \
            data-bind='value: Model.Value, attr: { required: metadata.required }, css: { verror: owner.ValidationErrors }' />"],

    ["jay-data-grid-$data.Number-default-editor",
        "<input type='text' \
            data-bind='value: Model.Value, attr: { required: metadata.required }, css: { verror: owner.ValidationErrors }' />"],

    ["jay-data-grid-$data.Geography-default-editor",
        "Long:<input type='text' \
            data-bind='value: Model.Longitude, attr: { required: metadata.required }, css: { verror: owner.ValidationErrors }' /><br /> \
        Lat:<input type='text' \
            data-bind='value: Model.Latitude, attr: { required: metadata.required }, css: { verror: owner.ValidationErrors }' />"],

    ["jay-data-grid-$data.Geography-default-display",
        "<span data-bind='text: Model.Longitude'></span> / <span data-bind='text: Model.Latitude'></span>"],

    ["jay-data-grid-$data.Date-default-editor",
        "<input type='date' \
            data-bind='value: Model.Date, attr: { required: metadata.required }' /> \
        <input type='text' \
            data-bind='value: Model.Time, attr: { required: metadata.required }' />"],

    ["jay-data-grid-$data.Date-default-display",
        "<div data-bind='if: Model.Date'><span data-bind='text: Model.Date'></span> \
        <span data-bind='text: Model.Time'></span> \
        (GMT <span data-bind='text: Model.Display.OffsetPoz'></span><span data-bind='text: Model.Display.Offset'></span>)</div>"],


    ["jay-data-grid-$data.Object-default-display",
        "<span data-bind='text: Model.Value'></span>"],

    ["jay-data-grid-$data.Object-default-editor",
        '<input type="text" data-bind="value: Model.Value, attr: { required: metadata.required }" />'],

    ["jay-data-grid-$data.Array-default-display",
        "<span data-bind='text: Model.Value'></span>"],

    ["jay-data-grid-$data.Array-default-editor",
        '<span data-bind="text: Model.ElementTypeName"></span><br /><input type="text" data-bind="value: Model.Value, attr: { required: metadata.required }" />'],

    ["jay-data-grid-$data.Blob-Image-default-editor",
        '<div data-bind="if: Model.DataUri"> \
            <img src="#" height="50px" width="50px" data-bind="attr: { src: Model.DataUri }"/> \
        </div>\
        <input type="file" accept="image/*" data-bind="file: Model.File"/> '],

    ["jay-data-grid-$data.Blob-Image-default-display",
        '<div data-bind="if: Model.DataUri">\
            <img class="thumb" src="#" height="50px" width="50px" data-bind="attr: { src: Model.DataUri }"/>\
        </div>'],

    //["jay-data-grid-$data.Blob-default-editor",
    //    '<input type="file" data-bind="file: Model.File, attr: { accept: Model.ContentType }"/>\
    //    <span data-bind="text: Model.Name"></span>'],

    //["jay-data-grid-$data.Blob-default-display",
    //    '<a src="#" target="_blank" data-bind="attr: { href: Model.Link }">download</a>'],

    
];
    $data.jayGridTemplates = $data.jayGridTemplates || {};
    $data.jayGridTemplates.tableTemplate = templateList;
})($data);
