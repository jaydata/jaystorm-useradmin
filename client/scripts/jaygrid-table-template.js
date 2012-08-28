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
        "<form data-bind='submit:save'><table data-bind='visible: source' class='jay-data-grid' border='1'> \
            <thead>\
            <td data-bind='attr: {colspan: columns().length}'>\
                <span data-x-bind='text: $root.discriminatorValue'></span>\
                <a href='#' data-bind='click: addNew, text: \"New \" '/> \
                <input type='submit' value='Save' data-bind='visible: pendingChanges' />\
                Sort: <select data-bind='options: columns, optionsValue: \"name\", optionsText: \"name\", value: sortColumn'></select>\
                <a href='#' data-bind='click:removeAll'>Remove all</a>\
            </td>\
            </thead>\
            <!-- ko template: { name: 'jay-data-grid-head' } --> \
            <!-- /ko -->\
            <!-- ko template: { name: 'jay-data-grid-body' } --> \
            <!-- /ko -->\
            <tbody>\
            <td data-bind='attr: {colspan: columns().length}'>\
                <a href='#' data-bind='click: addNew, text: \"New \" '/> \
                <input type='submit' value='Save' data-bind='visible: pendingChanges'/>\
                <span data-bind='visible: pendingChanges, text: pendingStatusInfo()' />\
                <select data-bind='options: ko.utils.range(1,50), value: pageSize, visible: pageSize() > 0'></select>\
                <a hef='#' data-bind='click:goToPreviousPage'> < </a>\
                <select data-bind='options: pages, value: currentPage'></select>\
                <a hef='#' data-bind='click:goToNextPage'> > </a>\
            </td>\
            </tbody>\
        </table></form>"],

    ["jay-data-grid-head",
        "<thead class='jay-data-grid-columns'>\
           <tr class='jay-data-grid-columns-row' \
           data-bind=\"template: { name: 'jay-data-grid-header-cell', foreach: columns}\"\
           </tr>\
        </thead>"],


    ["jay-data-grid-body",
        "<tbody data-bind=\"template: {name: 'jay-data-grid-row', foreach: items}\"></tbody>"],

    ["jay-data-grid-row",
        "<tr  data-bind='template: { foreach: $data.getColumns($index) } '>\
            <!-- ko template: { name: (metadata[\"isVirtual\"] ? 'jay-data-grid-control-cell' : 'jay-data-grid-data-cell') } -->\
            <!-- /ko -->\
        </tr>"],


    ["jay-data-grid-data-cell",
        "<td data-bind='template: $root.getTemplate($data.owner,$data.metadata)'></td>"],


//    visible: visible($parents[1]), \
//    click: $data.execute, \
    //<span data-bind='with: $parent'>\
    //</span>\
    ["jay-data-grid-control-cell",
        "<td>\
            <div  data-bind='foreach: itemCommands'>\
                <a href='#' data-bind='click: execute.bind($data,$parents[1]), \
                                       visible: visible.call($data,$parents[1]), text: displayName'></a>\
            </div>\
        </td>"],

    ["jay-data-grid-header-cell",
        "<td data-bind='text: $data[\"$displayName\"] || name'></td>"],

    ["jay-data-grid-generic-display",
        "<span data-bind='text: value'></span>"],

    ["jay-data-grid-bound-field-display",
        "<span data-bind='readValue: { source: $root.context()[metadata[\"$sourceTable\"]], \
                                                        key: owner[metadata[\"$sourceKey\"]], \
                                                        field: metadata[\"$sourceDisplay\"] }'></span>"],

    ["jay-data-grid-bound-field-editor",
        "<select data-bind='options: $root.context()[metadata[\"$sourceTable\"]].toKoArray(),\
                            value: value,\
                            optionsText: metadata[\"$sourceDisplay\"],\
                            optionsValue: metadata[\"$sourceKey\"],\
                            optionsCaption: \"Get some\"'></select>"],

    ["jay-data-grid-$data.Boolean-display",
        '<input type="checkbox" data-bind="checked: value" disabled />'],

    ["jay-data-grid-$data.String-display",
        '<span data-bind="text: value"></span>'],

    ["jay-data-grid-$data.Array-display",
        '[<span data-bind="foreach: value"><span data-bind="text:$data"></span></span>]'],

    ["jay-data-grid-generic-editor",
        '<input data-bind="value: value, attr: { required: metadata.required }" />'],

    ["jay-data-grid-$data.Boolean-editor",
        '<input type="checkbox" data-bind="checked: $parent[name]"  />'],

    ["jay-data-grid-Edm.String-editor",
        "<input data-bind='value: value, attr: { required: metadata[\"required\"] }, css: { verror: owner.ValidationErrors }' />" ],

    ["jay-data-grid-Edm.Int32-editor",
        "<input  type='range' min=1 max=10 \
            data-bind='value: value, attr: { required: $data[\"required\"] }, css: { verror: owner.ValidationErrors }' />" ]

];
    $data.jayGridTemplates = $data.jayGridTemplates || {};
    $data.jayGridTemplates.tableTemplate = templateList;
})($data);