# https://www.petewilcock.com/using-poppler-pdftotext-and-other-custom-binaries-on-aws-lambda/

ARG POPPLER_VERSION="21.10.0"
ARG POPPLER_DATA_VERSION="0.4.11"
ARG OPENJPEG_VERSION="2.4.0"

FROM public.ecr.aws/lambda/python:3.12.2024.07.10.11-x86_64

ARG POPPLER_VERSION
ARG POPPLER_DATA_VERSION
ARG OPENJPEG_VERSION

WORKDIR /root

RUN dnf update -y

RUN dnf install -y \
   cmake \
   cmake3 \
   fontconfig-devel \
   gcc \
   gcc-c++ \
   gzip \
   libjpeg-devel \
   libpng-devel \
   libtiff-devel \
   make \
   tar \
   xz \
   zip

RUN curl -o poppler.tar.xz https://poppler.freedesktop.org/poppler-${POPPLER_VERSION}.tar.xz
RUN tar xf poppler.tar.xz
RUN curl -o poppler-data.tar.gz https://poppler.freedesktop.org/poppler-data-${POPPLER_DATA_VERSION}.tar.gz
RUN tar xf poppler-data.tar.gz
RUN curl -o openjpeg.tar.gz https://codeload.github.com/uclouvain/openjpeg/tar.gz/refs/tags/v${OPENJPEG_VERSION}
RUN tar xf openjpeg.tar.gz

WORKDIR poppler-data-${POPPLER_DATA_VERSION}

RUN make install

WORKDIR /root

RUN mkdir openjpeg-${OPENJPEG_VERSION}/build

WORKDIR openjpeg-${OPENJPEG_VERSION}/build

RUN cmake .. -DCMAKE_BUILD_TYPE=Release
RUN make
RUN make install

WORKDIR /root

RUN mkdir poppler-${POPPLER_VERSION}/build

WORKDIR poppler-${POPPLER_VERSION}/build

RUN cmake3 .. -DCMAKE_BUILD_TYPE=release -DBUILD_GTK_TESTS=OFF -DBUILD_QT5_TESTS=OFF -DBUILD_QT6_TESTS=OFF \
    -DBUILD_CPP_TESTS=OFF -DBUILD_MANUAL_TESTS=OFF -DENABLE_BOOST=OFF -DENABLE_CPP=OFF -DENABLE_GLIB=OFF \
    -DENABLE_GOBJECT_INTROSPECTION=OFF -DENABLE_GTK_DOC=OFF -DENABLE_QT5=OFF -DENABLE_QT6=OFF \
    -DENABLE_LIBOPENJPEG=openjpeg2 -DENABLE_CMS=none  -DBUILD_SHARED_LIBS=OFF
RUN make
RUN make install

WORKDIR /root
RUN mkdir -p package/{lib,bin,share}
RUN cp -d /usr/lib64/libexpat* package/lib
RUN cp -d /usr/lib64/libfontconfig* package/lib
RUN cp -d /usr/lib64/libfreetype* package/lib
RUN cp -d /usr/lib64/libjbig* package/lib
RUN cp -d /usr/lib64/libjpeg* package/lib
RUN cp -d /usr/lib64/libpng* package/lib
RUN cp -d /usr/lib64/libtiff* package/lib
RUN cp -d /usr/lib64/libuuid* package/lib
RUN cp -d /usr/lib64/libz* package/lib
RUN cp -rd /usr/local/lib/* package/lib
RUN cp -rd /usr/local/lib64/* package/lib
RUN cp -d /usr/local/bin/* package/bin
RUN cp -rd /usr/local/share/poppler package/share
RUN cp -d /usr/lib64/libb* package/lib
RUN cp -d /usr/lib64/libwebp* package/lib
RUN cp -d /usr/lib64/libharfbuzz* package/lib
RUN cp -d /usr/lib64/libgraphite2* package/lib
