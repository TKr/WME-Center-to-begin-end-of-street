// ==UserScript==
// @name          WME center to begin-end of street
// @description    Tool for easily centering map on node A or B of selected street
// @namespace       http://pyrczak.pl
// @grant          none
// @version       0.0.6
// @match               https://editor-beta.waze.com/*editor*
// @match               https://www.waze.com/*editor*
// @author         Pawel Pyrczak '2018
// @license         MIT/BSD/X11
// ==/UserScript==


/*
 * v0.0.6 - quick fixes for new WME version
 * v0.0.5 - some changes made by FZ69617
 */


function WMEbes_bootstrap()
{
      //use "dirty" but effective method with injection to document
      var DLscript = document.createElement("script");
      DLscript.textContent ='unsafeWindow=window; \n'+ // need this for compatibility
      WMEbes_init.toString()+' \n'+
      'WMEbes_init();';
      DLscript.setAttribute("type", "application/javascript");
      document.body.appendChild(DLscript);
}


function WMEbes_init() {

   WMEbes =  {
      last: new Array(),
      isLast: false,
      refreshB: false
   };

    WMEbes.insertButtons = function () {
        if (this.refreshB) {
            if(document.getElementById('WMEbes') != null) document.getElementById('WMEbes').parentNode.removeChild(document.getElementById('WMEbes'));
        }

        if(unsafeWindow.Waze.selectionManager.selectedItems.length == 0) return;

        try{
            if(document.getElementById('WMEbes') != null) return;
        }
        catch(e){ }

        var b1 = $('<button class="waze-btn waze-btn-white" style="margin-left: 0px;padding-left:15px;padding-right:15px;" title="Go to segment A">A</button>');
        b1.click(WMEbes.goBegin);
        var b2 = $('<button class="waze-btn waze-btn-white" style="margin-left: 5px;padding-left:15px;padding-right:15px;" title="Go to segment B">B</button>');
        b2.click(WMEbes.goEnd);
        if (WMEbes.isLast) {
         var b3 = $('<button class="waze-btn waze-btn-default" style="margin-left: 5px;padding-left:10px;padding-right:10px;background-color:#26bae8;" title="Go to remebered position">return</button>');
         b3.click(WMEbes.goLast);
         var b4 = $('<button class="waze-btn waze-btn-default" style="margin-left: 5px;padding-left:5px;padding-right:5px;background-color:#ffcccc;" title="Delete remebered position">X</button>');
         b4.click(WMEbes.removeLast);
      }

        var c = $('<section id="WMEbes" class="attributes-form side-panel-section"/>');

        var dGroup = $('<div class="control-group"/>');
        var dControls = $('<div class="controls"/>');
        dControls.append( $('<label class="control-label">Go to</label>') );
        dControls.append(b1);
        dControls.append(b2);
        if (WMEbes.isLast) {
         dControls.append(b3);
         dControls.append(b4);
      }
        dGroup.append(dControls);
        c.append(dGroup);

        $("#edit-panel section.tabs-container").append(c);

    }


    WMEbes.goBegin = function (ev) {
      WMEbes.go(ev,1);
   }

    WMEbes.goEnd = function (ev) {
      WMEbes.go(ev,2);
   }

    WMEbes.goLast = function( ev) {
      WMEbes.go(ev,3);
   }

    WMEbes.removeLast = function(ev) {
      WMEbes.isLast = false;
      WMEbes.refreshB = true;
      WMEbes.insertButtons();
      WMEbes.refreshB = false;
      WMEbes.saveLS();
   }

   WMEbes.loadLS = function() {
       if (this.isLSsupported) {

         try {
         if ("string" == typeof localStorage.WMEbes) {
            var s = JSON.parse(localStorage.WMEbes);
            this.isLast = s.isLast;
            this.last = s.last;
            if ("undefined" != typeof s.zoom) {
               this.zoom = s.zoom;
            }
         }

         } catch (err) {

         }
      }
   }

   WMEbes.saveLS = function() {
       if (this.isLSsupported) {
         var s = {};
         s.isLast = this.isLast;
         s.last = this.last;
         s.zoom = this.zoom;
         localStorage.WMEbes=JSON.stringify(s);
      }
   }


    WMEbes.timer = function() {
      if ((unsafeWindow.Waze.selectionManager.selectedItems.length > 0) && !(document.getElementById('WMEbes') != null)) {
          WMEbes.insertButtons();
      }
   }


    WMEbes.go = function (ev,where) {
        var convertOK;
        var foundSelectedSegment = false;


        for (var s=unsafeWindow.Waze.selectionManager.selectedItems.length-1; s>=0; s--) {
            var sel = Waze.selectionManager.selectedItems[s];
            if ((sel.type == "segment") || (sel.model.type == "segment")) {

                foundSelectedSegment = true;
                var pb = unsafeWindow.Waze.map.getCenter()
                var zoom = unsafeWindow.Waze.map.getZoom(); // Gets zoom level

                var vert = sel.geometry.getVertices();
                if (where == 3) {
                  if (this.isLast) {
                     var pa = {x: this.last[0] ,y: this.last[1] };
                     this.isLast = false;
                     zoom = this.zoom;
                  } else {
                     return;
                  }
            }
                else if (where == 1) {
               var pa = vert[0].clone();
            } else {
               var pa = vert[vert.length-1].clone();
            }
                //alert(pa.x+" "+pa.y);
                unsafeWindow.Waze.map.setCenter([pa.x,pa.y],zoom);

                if ((!this.isLast) && (where != 3)) {
               this.last = [pb.lon,pb.lat];
               this.zoom = zoom;
               this.isLast = true;
               this.saveLS();
               this.refreshB = true;
               this.insertButtons();
               this.refreshB = false;
            } else if (where == 3) {
               this.refreshB = true;
               this.insertButtons();
               this.refreshB = false;
               this.saveLS();
            }

            }
        }
        if (! foundSelectedSegment) {
            alert("Fatal Error, no selected road! how this is even possible that you see this message ?");
        }
    }

    WMEbes.console_log = function (msg) {
        if(typeof console != "undefined")
            console.log(msg);
    }


   WMEbes.startcode = function () {
      // Check if WME is loaded, if not, waiting a moment and checks again. if yes addiding event to selectionManager
      try {
         if ("undefined" != typeof unsafeWindow.Waze.selectionManager ) {
            unsafeWindow.Waze.selectionManager.events.register("selectionchanged", null, WMEbes.insertButtons);
               try { // check if localStorage is supported in this browser
                  if ('localStorage' in window && window['localStorage'] !== null)
                  WMEbes.isLSsupported = true;
               } catch (e) {
                  WMEbes.isLSsupported = false;
               }
            WMEbes.loadLS();
            WMEbes.interval = setInterval(WMEbes.timer,200);
            WMEbes.console_log("WME begin-end-street initialized");
         } else {
            setTimeout(WMEbes.startcode, 400);
         }
      } catch(err) {
            setTimeout(WMEbes.startcode, 400);
      }
   }


   WMEbes.startcode();


}


WMEbes_bootstrap();

