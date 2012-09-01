require('jaydata');
require('q');

$data.Entity.extend('JayStormAPI.Permission', {
    PermissionID: { type: 'id', key: true, computed: true },
    DatabaseID: { type: 'id', required: true, $sourceTable: 'Databases', $sourceValue: 'DatabaseID', $sourceText: 'Name' },
    EntitySetID: { type: 'id', required: true, $sourceTable: 'EntitySets', $sourceValue: 'EntitySetID', $sourceText: 'Name' },
    GroupID: { type: 'id', required: true, $sourceTable: 'Groups', $sourceValue: 'GroupID', $sourceText: 'Name' },
    Read: { type: 'boolean' },
    Create: { type: 'boolean' },
    Update: { type: 'boolean' },
    Delete: { type: 'boolean' },
    DeleteBatch: { type: 'boolean' },
    Execute: { type: 'boolean' },
    Manage: { type: 'boolean' },
    CreationDate: { type: 'date' }
});

$data.Entity.extend('JayStormAPI.Entity', {
    EntityID: { type: 'id', key: true, computed: true },
    Name: { type: 'string', required: true },
    FullName: { type: 'string', required: true },
    Namespace: { type: 'string' },
    DatabaseID: { type: 'id', required: true }
});

$data.Class.defineEx('JayStormAPI.APIContext', [$data.EntityContext, $data.ServiceBase], null, {
    Permissions: { type: $data.EntitySet, elementType: JayStormAPI.Permission },
    Entities: { type: $data.EntitySet, elementType: JayStormAPI.Entity }
});

exports.serviceType = JayStormAPI.APIContext;
