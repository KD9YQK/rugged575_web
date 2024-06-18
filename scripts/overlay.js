function initialize() {
    initmap('map_canvas', 'test', null, null, null, null, 0);
    setmap(41.8019218444824, -88.2380599975586, 6);
    do_overlays();
}

var rmap1, rmap2, mk1;
function showcov(m) {
    if (m === parseInt("0")) {
        rmap1.setVisible(false);
        rmap2.setVisible(false);
        console.log('blank')
    }
    if (m === parseInt("1")) {
        rmap1.setVisible(true);
        rmap2.setVisible(false);
    }
    if (m === parseInt("2")) {
        rmap1.setVisible(false);
        rmap2.setVisible(true);
    }
}

function showtow(t) {
    if (t.checked) {
        mk1.setVisible(true)
    } else (
        mk1.setVisible(false)
    )
    
}

function do_overlays() {
    docov();
}

function docov() {
    rmap1 = addimage("images/overlay_50w.png", 39.10396, -91.85728, 44.49989, -84.61884);
    rmap2 = addimage("images/overlay_5w.png", 39.10396, -91.85728, 44.49989, -84.61884);
    rmap2.setVisible("false")
    mk1 = addmarker(0, 41.80192219, -88.23806177, "x");
}
