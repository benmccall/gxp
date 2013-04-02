/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/LayerSource.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = CloudMadeSource
 */

/** api: (extends)
 *  plugins/LayerSource.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: CloudMadeSource(config)
 *
 *    Plugin for using CloudMade layers with :class:`gxp.Viewer` instances.
 *
 *    Available layer names:
 *     * fine-line
 *     * fresh
 *     * midnight-commander
 *     * no-names
 *     * pale-dawn
 *     * red-alert
 *     * the-original
 *     * tourist
 */
/** api: example
 *  The configuration in the ``sources`` property of the :class:`gxp.Viewer` is
 *  straightforward:
 *
 *  .. code-block:: javascript
 *
 *    "cloudmade": {
 *        ptype: "gxp_cloudmadesource"
 *    }
 *
 *  A typical configuration for a layer from this source (in the ``layers``
 *  array of the viewer's ``map`` config option would look like this:
 *
 *  .. code-block:: javascript
 *
 *    {
 *        source: "cloudmade",
 *        name: "the-original",
 *        apiKey: "8ee2a50541944fb9bcedded5165f09d9",
 *    }
 *
 */
gxp.plugins.CloudMadeSource = Ext.extend(gxp.plugins.LayerSource, {
    
    /** api: ptype = gxp_cloudmadesource */
    ptype: "gxp_cloudmadesource",

    /** api: property[store]
     *  ``GeoExt.data.LayerStore``. Will contain records with name field values
     *  matching CloudMade layer names.
     */
    
    /** api: config[title]
     *  ``String``
     *  A descriptive title for this layer source (i18n).
     */
    title: "CloudMade Layers",

    /** api: config[osmAttribution]
     *  ``String``
     *  Attribution string for OSM generated layer (i18n).
     */
    attribution: "Rendering &copy; 2009 <a href='http://cloudmade.com'>CloudMade</a>. Data by <a href='http://openstreetmap.org'>OpenStreetMap</a>, under <a href='http://creativecommons.org/licenses/by-sa/3.0'>CC BY SA</a>.",
 
    /** i18n **/
    fineLineTitle: "Fine Line",
    freshTitle: "Fresh",
    midnightCommanderTitle: "Midnight Commander",
    noNamesTitle: "No-Names",
    paleDawnTitle: "Pale Dawn",
    redAlertTitle: "Red Alert",
    theOriginalTitle: "The Original",
    touristTitle: "Tourist",

    /** api: config[apiKey]
     *  ``String``
     *  API key generated from http://account.cloudmade.com/user for your domain.
     */
    apiKey: "8ee2a50541944fb9bcedded5165f09d9",

    /** api: method[createStore]
     *
     *  Creates a store of layer records.  Fires "ready" when store is loaded.
     */
    createStore: function() {

        var options = {
            projection: "EPSG:900913",
            numZoomLevels: 19,
            attribution: this.attribution,
            buffer: 1,
            transitionEffect: "resize",
            tileOptions: {crossOriginKeyword: null}
        };

        var configs = [
            {name: "fine-line", styleId: 2},
            {name: "fresh", styleId: 997},
            {name: "midnight-commander", styleId: 999},
            {name: "no-names", styleId: 3},
            {name: "pale-dawn", styleId: 998},
            {name: "red-alert", styleId: 8},
            {name: "the-original", styleId: 1},
            {name: "tourist", styleId: 7},
        ];

        var len = configs.length;
        var layers = new Array(len);
        var config;
        for (var i=0; i<len; ++i) {
            config = configs[i];
            layers[i] = new OpenLayers.Layer.XYZ(
                this[OpenLayers.String.camelize(config.name) + "Title"],
                [
                    ["http://a.tile.cloudmade.com/", [this.apiKey, config.styleId, 256].join("/") ,"/${z}/${x}/${y}.png"].join(""),
                    ["http://b.tile.cloudmade.com/", [this.apiKey, config.styleId, 256].join("/") ,"/${z}/${x}/${y}.png"].join(""),
                    ["http://c.tile.cloudmade.com/", [this.apiKey, config.styleId, 256].join("/") ,"/${z}/${x}/${y}.png"].join(""),
                ],
                OpenLayers.Util.applyDefaults({
                    layername: config.name
                }, options)
            );
        }
        
        this.store = new GeoExt.data.LayerStore({
            layers: layers,
            fields: [
                {name: "source", type: "string"},
                {name: "name", type: "string", mapping: "layername"},
                {name: "abstract", type: "string", mapping: "attribution"},
                {name: "group", type: "string", defaultValue: "background"},
                {name: "fixed", type: "boolean", defaultValue: true},
                {name: "selected", type: "boolean"}
            ]
        });
        this.store.each(function(l) {
            l.set("group", "background");
        });
        this.fireEvent("ready", this);

    },
    
    /** api: method[createLayerRecord]
     *  :arg config:  ``Object``  The application config for this layer.
     *  :returns: ``GeoExt.data.LayerRecord``
     *
     *  Create a layer record given the config.
     */
    createLayerRecord: function(config) {
        var record;
        var index = this.store.findExact("name", config.name);
        if (index > -1) {

            record = this.store.getAt(index).copy(Ext.data.Record.id({}));
            var layer = record.getLayer().clone();
 
            // set layer title from config
            if (config.title) {
                /**
                 * Because the layer title data is duplicated, we have
                 * to set it in both places.  After records have been
                 * added to the store, the store handles this
                 * synchronization.
                 */
                layer.setName(config.title);
                record.set("title", config.title);
            }

            // set visibility from config
            if ("visibility" in config) {
                layer.visibility = config.visibility;
            }
            
            record.set("selected", config.selected || false);
            record.set("source", config.source);
            record.set("name", config.name);
            if ("group" in config) {
                record.set("group", config.group);
            }

            record.data.layer = layer;
            record.commit();
        }
        return record;
    }

});

Ext.preg(gxp.plugins.CloudMadeSource.prototype.ptype, gxp.plugins.CloudMadeSource);