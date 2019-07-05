PREFIX ?=/usr/share/queex
SUDO ?= sudo
INSTALLOPT=$(if $(SUDO), --group=devel --mode=0664 ,"--mode=0644")
QLIB=$(PREFIX)/htdocs/lib
QUI-CTPP=$(PREFIX)/ctpp/lib/queex-ui
QUI-HTDOCS=$(PREFIX)/htdocs/lib/queex-ui

BOOTSTRAP=3.3.7
BOOTSTRAP4=4.0.0
TINYMCE=4.7.12
JQUERY=1.12.4
BOOTSTRAP_DP=1.9.0
SPRINTF_JS=1.1.1
SNAP=0.5.1
VIEWERJS=0.5.8
FONTAWESOME=4.7.0

all:

install: install_templates install_static

install_all: install install_3rdparty

install_3rdparty: install_tinymce4_patched install_jstools install_bootstrap3 install_bootstrap4 install_popper install_js_sprintf install_bootstrap_datepicker install_snap install_tinymce_youtube install_viewer_js 

bigclean:
	$(SUDO) rm -rf $(QADM-CTPP) $(QADM-HTDOCS) 

clean:

ai: install

air: ai


## needs node.js to patch and rebuid tinymce (to add languages highlighting)
## sudo apt-get install nodejs
## sudo npm i -g grunt-cli
## npm i 
######

install_tinymce4_patched:
	( cp etc/codesample.ts.patch /tmp )
	( $(SUDO) rm -rf /tmp/tmce* /tmp/tinymce* )
	( wget -c -O /tmp/tmce4.zip	https://github.com/tinymce/tinymce/archive/$(TINYMCE).zip && unzip -qo /tmp/tmce4.zip -d /tmp && mv /tmp/tinymce-$(TINYMCE) /tmp/tinymce )
#	( wget -c -O /tmp/tmce4.zip http://download.ephox.com/tinymce/community/tinymce_$(TINYMCE)_dev.zip && unzip -qo /tmp/tmce4.zip -d /tmp )
	( cd /tmp/tinymce && patch -p1 < /tmp/codesample.ts.patch )
	( cd /tmp/tinymce && npm i )

#### replace porkbun etc with old, pre-ts version
#	rm -rf /tmp/porkbun /tmp/boss /tmp/dragster /tmp/echo /tmp/phoenix /tmp/polaris /tmp/robin
#	( cd /tmp && git clone https://github.com/ephox/porkbun.git && (cd porkbun && git checkout b26226b6de624837470668dcaad4fa7a068bd903))
#	( cd /tmp && cp -r porkbun/* tinymce/node_modules/\@ephox/porkbun/ )
#
#	( cd /tmp && git clone https://github.com/ephox/boss.git && (cd boss && git checkout 95a896584e246f95f8b53f0c9dff1efaaf0103b8))
#	( cd /tmp && cp -r boss/* tinymce/node_modules/\@ephox/boss/)
#
#	( cd /tmp && git clone https://github.com/ephox/dragster.git && (cd dragster && git checkout b13c4e3dbfed1820ef06476a7d6f4d4771e1e43f))
#	( cd /tmp && cp -r dragster/* tinymce/node_modules/\@ephox/dragster/ )
#
#	( cd /tmp && git clone https://github.com/ephox/echo.git && (cd echo && git checkout fecc1f7386af6558453d011847ead9200e98a559))
#	( cd /tmp && cp -r echo/* tinymce/node_modules/\@ephox/echo/ )
#
#	( cd /tmp && git clone https://github.com/ephox/phoenix.git && (cd phoenix && git checkout 2e09463e97acea7fff7c98338caefc8b3328e605))
#	( cd /tmp && cp -r phoenix/* tinymce/node_modules/\@ephox/phoenix/ )
#
#	( cd /tmp && git clone https://github.com/ephox/polaris.git && (cd polaris && git checkout 5d4cfb09290dae34f4ee65ce86284eca6a77c224))
#	( cd /tmp && cp -r polaris/* tinymce/node_modules/\@ephox/polaris/ )
#
#	( cd /tmp && git clone https://github.com/ephox/robin.git && (cd robin && git checkout 70737ac35266d73a6044bd297a40ce02268e5bda))
#	( cd /tmp && cp -r robin/* tinymce/node_modules/\@ephox/robin/ ) 


#	# заменим ту версию prism.js что включена в tinymce на нашу, с более реалистичным списком поддерживаемых языков
	perl -MFile::Slurp -i -e 'my $$g=File::Slurp::read_file("htdocs/prism.ts"); my $$s=0; while(<>) { if($$s==0) { if(/Start wrap/) { $$s=1; } print $$_; if($$s==1) {print "$$g\n$$_";} } elsif ($$s==1) { if(/End wrap/) { $$s=2; }} else { print $$_; }}' /tmp/tinymce/src/plugins/codesample/main/ts/core/Prism.ts
	( cd /tmp/tinymce &&  grunt --force && cd tmp && unzip tinymce_$(TINYMCE).zip )
#	perl -MFile::Slurp -i -e 'my $$g=File::Slurp::read_file("htdocs/prism.js"); my $$s=0; while(<>) { if($$s==0) { if(/Start wrap/) { $$s=1; } print $$_; if($$s==1) {print "$$g\n$$_";} } elsif ($$s==1) { if(/End wrap/) { $$s=2; }} else { print $$_; }}' /tmp/tinymce/src/plugins/codesample/main/ts/core/Prism.ts
	( cd /tmp/tinymce/tmp/tinymce && find . -type f -exec $(SUDO) install -m 664 -g devel -D {} $(QLIB)/j/tinymce4/{} \; )
	( wget -c -O /tmp/tmce4_lang_ru.zip http://archive.tinymce.com/i18n/download.php?download=ru && $(SUDO) unzip -qo /tmp/tmce4_lang_ru.zip -d $(QLIB)/j/tinymce4/js/tinymce/ )
	( $(SUDO) rm -rf /tmp/tmce* /tmp/tinymce* )

install_tinymce4:
	( $(SUDO) rm -rf /tmp/tmce* /tmp/tinymce* )
	( wget -c -O /tmp/tmce4.zip http://download.ephox.com/tinymce/community/tinymce_$(TINYMCE).zip && unzip -qo /tmp/tmce4.zip -d /tmp )
	( cd /tmp/tinymce && find . -type f -exec $(SUDO) install -m 664 -g devel -D {} $(QLIB)/j/tinymce4/{} \; )
	( wget -c -O /tmp/tmce4_lang_ru.zip http://archive.tinymce.com/i18n/download.php?download=ru && $(SUDO) unzip -qo /tmp/tmce4_lang_ru.zip -d $(QLIB)/j/tinymce4/js/tinymce/ )
	( $(SUDO) rm -rf /tmp/tmce* /tmp/tinymce* )
	
install_bootstrap3:
	( if [ ! -d "$(QLIB)/j/bootstrap" ]; then $(SUDO) mkdir $(QLIB)/j/bootstrap ; fi )
	( if [ -n "$(SUDO)" ]; then $(SUDO) chmod g+w $(QLIB)/j/bootstrap && $(SUDO) chown :devel $(QLIB)/j/bootstrap; fi )
	( rm -rf /tmp/bootstrap-$(BOOTSTRAP)-dist* /tmp/dist)
	( wget -c -O /tmp/bootstrap-$(BOOTSTRAP)-dist.zip https://github.com/twbs/bootstrap/releases/download/v$(BOOTSTRAP)/bootstrap-$(BOOTSTRAP)-dist.zip && unzip -qo /tmp/bootstrap-$(BOOTSTRAP)-dist.zip -d /tmp && cd /tmp/bootstrap-$(BOOTSTRAP)-dist && find . -type f -exec $(SUDO) install $(INSTALLOPT) -D {} $(QLIB)/j/bootstrap/{} \; )
	( rm -rf /tmp/bootstrap-$(BOOTSTRAP)-dist* )

install_bootstrap4:
	( if [ ! -d "$(QLIB)/j/bootstrap4" ]; then $(SUDO) mkdir $(QLIB)/j/bootstrap4 ; fi )
	( if [ -n "$(SUDO)" ]; then $(SUDO) chmod g+w $(QLIB)/j/bootstrap4 && $(SUDO) chown :devel $(QLIB)/j/bootstrap4; fi )
	( rm -rf /tmp/bootstrap-$(BOOTSTRAP4)-dist* /tmp/dist)
	( mkdir /tmp/bootstrap-$(BOOTSTRAP4)-dist )
	( wget -c -O /tmp/bootstrap-$(BOOTSTRAP4)-dist.zip https://github.com/twbs/bootstrap/releases/download/v$(BOOTSTRAP4)/bootstrap-$(BOOTSTRAP4)-dist.zip && unzip -qo /tmp/bootstrap-$(BOOTSTRAP4)-dist.zip -d /tmp/bootstrap-$(BOOTSTRAP4)-dist && cd /tmp/bootstrap-$(BOOTSTRAP4)-dist && find . -type f -exec $(SUDO) install $(INSTALLOPT) -D {} $(QLIB)/j/bootstrap4/{} \; )
	( rm -rf /tmp/bootstrap-$(BOOTSTRAP4)-dist* )

install_popper:
	( if [ ! -d /tmp/jstools-qui ]; then mkdir /tmp/jstools-qui; fi )
	wget -c -O /tmp/jstools-qui/popper.min.js https://unpkg.com/popper.js/dist/umd/popper.min.js
	(cd /tmp/jstools-qui && find -L . -type f -exec $(SUDO) install $(INSTALLOPT) -D {} $(QLIB)/j/{} \; )
	(rm -rf /tmp/jstools-qui)

install_jstools:
	( if [ ! -d /tmp/jstools-qui ]; then mkdir /tmp/jstools-qui; fi )
	(wget --no-check-certificate -c -O /tmp/jstools-qui/jquery.min.js http://code.jquery.com/jquery-$(JQUERY).min.js)
	(wget --no-check-certificate -c -O /tmp/jstools-qui/underscore-min.js http://underscorejs.org/underscore-min.js )
	(wget --no-check-certificate -c -O /tmp/jstools-qui/json2.js	https://raw.github.com/douglascrockford/JSON-js/master/json2.js)
	(wget --no-check-certificate -c -O /tmp/fa.zip  https://fontawesome.com/v$(FONTAWESOME)/assets/font-awesome-$(FONTAWESOME).zip  && unzip -o -d /tmp/jstools-qui /tmp/fa.zip && cd /tmp/jstools-qui && ln -s font-awesome-$(FONTAWESOME) font-awesome)
#	(wget --no-check-certificate -c -O /tmp/jstools-qui/typeahead.jquery.min.js  https://raw.githubusercontent.com/twitter/typeahead.js/master/dist/typeahead.jquery.min.js)
#	(wget --no-check-certificate -c -O /tmp/jstools-qui/typeahead.jquery.js      https://raw.githubusercontent.com/twitter/typeahead.js/master/dist/typeahead.jquery.js)
	(wget --no-check-certificate -c -O /tmp/jstools-qui/typeahead.jquery.min.js    https://raw.githubusercontent.com/waaeer/typeahead.js/wao/dist/typeahead.jquery.min.js)
	(wget --no-check-certificate -c -O /tmp/jstools-qui/typeahead.jquery.js        https://raw.githubusercontent.com/waaeer/typeahead.js/wao/dist/typeahead.jquery.js)
	(wget -c -O /tmp/jstools-qui/jquery-sortable.js http://johnny.github.io/jquery-sortable/js/jquery-sortable.js )
#	(wget -c -O /tmp/gridrotator.zip http://tympanus.net/Development/AnimatedResponsiveImageGrid/AnimatedResponsiveImageGrid.zip && cd /tmp && unzip -o gridrotator.zip && cd  AnimatedResponsiveImageGrid/js/ && cp jquery.gridrotator.js modernizr.custom.26633.js /tmp/jstools-qui && cp ../css/style.css /tmp/jstools-qui/gridrotator.css)
	(cd /tmp && rm -rf Gallery jstools-qui/blueimp-gallery/ && mkdir jstools-qui/blueimp-gallery/ && git clone https://github.com/blueimp/Gallery.git && cd Gallery && cp -r img css js /tmp/jstools-qui/blueimp-gallery/ )
#	(cd /tmp && rm -rf Bootstrap-Image-Gallery && git clone https://github.com/blueimp/Bootstrap-Image-Gallery.git && cd Bootstrap-Image-Gallery && cp js/bootstrap-image-gallery.min.js css/bootstrap-image-gallery.min.css  /tmp/jstools-qui/)
	
	(cd /tmp/jstools-qui && find -L . -type f -exec $(SUDO) install $(INSTALLOPT) -D {} $(QLIB)/j/{} \; )
	(rm -rf /tmp/jstools-qui)

install_bootstrap_datepicker:
	( if [ ! -d /tmp/bsdp ]; then mkdir /tmp/bsdp; fi )
	(cd /tmp/bsdp && rm -rf /tmp/bsdp/* &&  wget -c -O bsdp.zip https://github.com/eternicode/bootstrap-datepicker/releases/download/v$(BOOTSTRAP_DP)/bootstrap-datepicker-$(BOOTSTRAP_DP)-dist.zip && unzip bsdp.zip)
	(cd /tmp/bsdp && rm -f bsdp.zip)
	(cd /tmp/bsdp && find . -type f -exec $(SUDO) install $(INSTALLOPT) -D {} $(QLIB)/j/bootstrap-datepicker/{} \; )

install_js_sprintf:
	( if [ ! -d /tmp/jssp ]; then mkdir /tmp/jssp; fi )
	(cd /tmp/jssp && wget -c https://github.com/alexei/sprintf.js/archive/$(SPRINTF_JS).tar.gz)
	(cd /tmp/jssp && tar -xzf $(SPRINTF_JS).tar.gz && $(SUDO) install $(INSTALLOPT) -D sprintf.js-$(SPRINTF_JS)/dist/sprintf.min.js $(QLIB)/j/sprintf.min.js )

install_snap:
	( if [ ! -d /tmp/jssnap ]; then mkdir /tmp/jssnap; fi )
	rm -rf /tmp/jssnap/* 
	(cd /tmp/jssnap && rm -f jssnap.zip && wget -O jssnap.zip -c https://codeload.github.com/adobe-webplatform/Snap.svg/zip/v$(SNAP) )
	(cd /tmp/jssnap && unzip jssnap.zip )
	(cd /tmp/jssnap && $(SUDO) install $(INSTALLOPT) -D Snap.svg-$(SNAP)/dist/snap.svg.js      $(QLIB)/j/ )
	(cd /tmp/jssnap && $(SUDO) install $(INSTALLOPT) -D Snap.svg-$(SNAP)/dist/snap.svg-min.js  $(QLIB)/j/ )

install_tinymce_youtube:
	( if [ ! -d /tmp/tmyout ]; then mkdir /tmp/tmyout; fi )
	rm -rf /tmp/tmyout/*
	(cd /tmp/tmyout/ && git clone https://github.com/gtraxx/tinymce-plugin-youtube.git )
	(cd /tmp/tmyout/ && unzip  tinymce-plugin-youtube/dist/youtube.zip )
#	( if [ ! -d $(QLIB)/j/tinymce4/js/tinymce/plugins/youtube/ ]; then $(SUDO) mkdir $(QLIB)/j/tinymce4/js/tinymce/plugins/youtube/; fi )
	(cd /tmp/tmyout/ && find youtube -type f -exec $(SUDO) install $(INSTALLOPT)  -D {} $(QLIB)/j/tinymce4/js/tinymce/plugins/{} \; )

install_viewer_js:
	(cd /tmp &&	wget -c http://viewerjs.org/releases/viewerjs-$(VIEWERJS).zip && unzip viewerjs-$(VIEWERJS).zip)
	(cd /tmp/viewerjs-$(VIEWERJS) && find ViewerJS -type f -exec $(SUDO) install $(INSTALLOPT)  -D {} $(QLIB)/j/{} \; ) 

install_templates:
	( if [ ! -d "$(QUI-CTPP)" ]; then $(SUDO) mkdir -p $(QUI-CTPP) ; fi) 
	( if [ -n "$(SUDO)" ]; then $(SUDO) chmod g+w $(QUI-CTPP) && $(SUDO) chown :devel $(QUI-CTPP); fi )
	( cd ctpp; for file in `find . -type f`; do $(SUDO) install $(INSTALLOPT) -D $$file $(QUI-CTPP)/$$file; done; )

install_static:
	( if [ ! -d "$(QUI-HTDOCS)" ]; then $(SUDO) mkdir -p $(QUI-HTDOCS) ; fi)
	( if [ -n "$(SUDO)" ]; then $(SUDO) chmod g+w $(QUI-HTDOCS) && $(SUDO) chown :devel $(QUI-HTDOCS); fi )
	( cd htdocs; for file in `find . -type f `; do $(SUDO) install $(INSTALLOPT) -D $$file $(QUI-HTDOCS)/$$file; done; )

