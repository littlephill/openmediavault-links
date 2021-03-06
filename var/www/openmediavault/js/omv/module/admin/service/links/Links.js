/**
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @author    OpenMediaVault Plugin Developers <plugins@omv-extras.org>
 * @copyright Copyright (c) 2009-2013 Volker Theile
 * @copyright Copyright (c) 2013-2015 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/grid/Panel.js")
// require("js/omv/workspace/window/Form.js")
// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/util/Format.js")
// require("js/omv/Rpc.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")
// require("js/omv/data/proxy/Rpc.js")

/**
 * @class OMV.module.admin.service.links.Link
 * @derived OMV.workspace.window.Form
 */
Ext.define("OMV.module.admin.service.links.Link", {
    extend   : "OMV.workspace.window.Form",
    requires : [
        "OMV.workspace.window.plugin.ConfigObject"
    ],

    rpcService   : "Links",
    rpcGetMethod : "getLink",
    rpcSetMethod : "setLink",
    plugins      : [{
        ptype : "configobject"
    }],

    getFormItems : function() {
        return [{
            xtype      : "combo",
            name       : "preset",
            fieldLabel : _("Preset"),
            store      : Ext.create("OMV.data.Store", {
                autoLoad : true,
                model    : OMV.data.Model.createImplicit({
                    idProperty : "name",
                    fields     : [{
                        name : "name",
                        type : "string"
                    }, {
                        name : "url",
                        type : "string"
                    }],
                    proxy : {
                        type    : "rpc",
                        rpcData : {
                            service : "Links",
                            method  : "enumeratePresets"
                        },
                        appendSortParams : false
                    }
                })
            }),
            allowBlank     : true,
            displayField   : "name",
            editable       : true,
            forceSelection : true,
            listeners      : {
                scope  : this,
                select : function(combo, records) {
                    var record = records;
                    if (Ext.isArray(records)) {
                        record = records[0];
                    }
                    var nameField = this.findField("name");
                    var urlField = this.findField("url");
                    nameField.setValue(record.get("name"));
                    urlField.setValue(record.get("url"));
                }
            },
            queryMode     : "local",
            submitValue   : false,
            triggerAction : "all",
            valueField    : "url"
        },{
            xtype      : "textfield",
            name       : "name",
            fieldLabel : _("Name"),
            allowBlank : false,
            plugins    : [{
                ptype : "fieldinfo",
                text  : _("No spaces allowed in name.")
            }]
        },{
            xtype      : "textfield",
            name       : "group",
            fieldLabel : _("Group"),
            allowBlank : false
        },{
            xtype      : "textfield",
            name       : "url",
            fieldLabel : _("URL"),
            allowBlank : false
        },{
            xtype      : "checkbox",
            name       : "createtab",
            fieldLabel : _("Media Tab"),
            checked    : false
        },{
            xtype      : "checkbox",
            name       : "plugintab",
            fieldLabel : _("Plugin Tab"),
            checked    : false
        }];
    }
});

Ext.define("OMV.module.admin.service.links.Links", {
    extend   : "OMV.workspace.grid.Panel",
    requires : [
        "OMV.Rpc",
        "OMV.data.Store",
        "OMV.data.Model",
        "OMV.data.proxy.Rpc",
        "OMV.util.Format"
    ],
    uses     : [
        "OMV.module.admin.service.links.Link"
    ],

    stateful          : true,
    stateId           : "a982a76d-6804-4632-b31b-8b48c0ea6dde",
    features          : [{
        ftype : "grouping"
    }],    
    columns           : [{
        text      : _("Name"),
        sortable  : true,
        dataIndex : "name",
        stateId   : "name"
    },{
        text      : _("Group"),
        sortable  : true,
        dataIndex : "group",
        stateId   : "group"
    },{
        text      : _("URL"),
        sortable  : true,
        dataIndex : "url",
        flex      : 1,
        stateId   : "url",
        renderer  : function(value) {
            var link = value.replace("\" + location.hostname + \"", location.hostname);
            return "<a href=\"" + link + "\" target=\"_blank\">" + link + "</a>";
        }
    }],

    initComponent : function() {
        var me = this;
        Ext.apply(me, {
            store : Ext.create("OMV.data.Store", {
                autoLoad   : true,
                groupField : "group",
                model      : OMV.data.Model.createImplicit({
                    idProperty  : "uuid",
                    fields      : [
                        { name : "uuid", type : "string" },
                        { name : "name", type : "string" },
                        { name : "group", type : "string" },
                        { name : "url", type : "string" }
                    ]
                }),
                proxy : {
                    type    : "rpc",
                    rpcData : {
                        service : "Links",
                        method  : "getLinks"
                    }
                },
                sorters : [{
                    direction : "ASC",
                    property  : "name"
                },{
                    direction : "ASC",
                    property  : "group"
                }]
            })
        });
        me.callParent(arguments);
    },

    onAddButton : function() {
        var me = this;
        Ext.create("OMV.module.admin.service.links.Link", {
            title     : _("Add link"),
            uuid      : OMV.UUID_UNDEFINED,
            listeners : {
                scope  : me,
                submit : function() {
                    this.doReload();
                }
            }
        }).show();
    },

    onEditButton : function() {
        var me = this;
        var record = me.getSelected();
        Ext.create("OMV.module.admin.service.links.Link", {
            title     : _("Edit link"),
            uuid      : record.get("uuid"),
            listeners : {
                scope  : me,
                submit : function() {
                    this.doReload();
                }
            }
        }).show();
    },

    doDeletion : function(record) {
        var me = this;
        OMV.Rpc.request({
            scope    : me,
            callback : me.onDeletion,
            rpcData  : {
                service : "Links",
                method  : "deleteLink",
                params  : {
                    uuid : record.get("uuid")
                }
            }
        });
    }

});

OMV.WorkspaceManager.registerNode({
    id      : "links",
    path    : "/service",
    text    : _("Links"),
    icon16  : "images/link.png",
    iconSvg : "images/link.svg"
});

OMV.WorkspaceManager.registerPanel({
    id        : "scheduledjobs",
    path      : "/service/links",
    text      : _("Links"),
    position  : 10,
    className : "OMV.module.admin.service.links.Links"
});
