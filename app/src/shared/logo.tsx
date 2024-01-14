// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export interface LogoProps {
  boxClassName: string;
  pathClassName: string;
}

export const LXCatLogo = ({ boxClassName, pathClassName }: LogoProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 114.235 68.717"
      className={boxClassName}
    >
      <path
        d="M137.786 162.74c-1.686-.308-2.494-.661-3.26-1.427-.4-.4-.545-.614-.62-.914-.129-.508-.12-1.126.019-1.517.204-.572 1.093-1.79 1.91-2.616.869-.88 1.339-1.222 1.792-1.303.252-.045.329-.01.646.297.198.191.358.392.357.447-.001.055-.18.233-.398.396-1.529 1.146-1.755 1.36-2.002 1.89-.242.519-.73 1.852-.73 1.993 0 .098 1.04.697 1.643.947.455.189.506.193 1.131.088.86-.144 2.419-.707 3.364-1.215.093-.05.36-.184.593-.298 1.023-.503 2.02-1.245 2.445-1.82l.264-.357.026.441c.035.615-.297 1.53-.797 2.199-.26.346-.255.418.041.572.563.29 1 .383 1.815.385 1.563.002 2.399-.566 2.864-1.948.148-.44.184-.743.183-1.522 0-.536-.046-1.137-.102-1.336-.055-.199-.077-.399-.05-.444.029-.046.341-.083.695-.083.643 0 .643 0 .974.348l.331.348-.026 2.001c-.03 2.188-.044 2.261-.576 2.805-.302.309-1.63 1.187-1.797 1.187a.378.378 0 0 0-.224.105c-.16.16-2.266.132-3.044-.04a4.566 4.566 0 0 1-1.101-.419c-.947-.554-.93-.55-1.23-.37-.812.482-1.73.895-2.275 1.022-.592.139-2.417.24-2.861.158zm-80.772-.166c-1.064-.137-1.517-.235-2.413-.521-3.288-1.051-4.894-3.407-4.055-5.948.595-1.798 2.555-3.12 5.579-3.761 1.346-.286 2.14-.347 4.445-.346 2.142 0 3.075.06 4.614.294 1.253.19 2.228.352 2.54.422l.974.213c.96.21 1.896.442 2.856.71.623.174.888.215.942.147.099-.126 1.027-2.016 1.252-2.55.75-1.783 1.525-4.568 2.272-8.17.23-1.107.423-2.01.554-2.582.043-.186.175-.815.295-1.397.211-1.03.395-1.892.55-2.583.043-.186.232-1.081.422-1.99.19-.907.38-1.803.423-1.989.043-.186.196-.91.34-1.609.263-1.273.35-1.68.508-2.35.047-.197.162-.72.257-1.163 1.385-6.443 3.006-10.957 5.032-14.005 2.824-4.25 6.537-6.813 9.882-6.822 1.994-.005 3.846.842 4.859 2.222 1.8 2.451 2.02 5.767.722 10.9-.462 1.83-1.087 3.758-1.523 4.7a5.375 5.375 0 0 0-.22.55c-.103.34-.196.405-.662.463-.242.03-.65.09-.906.131-1.534.251-2.221.345-2.259.307-.023-.023.243-.626.592-1.34 1.726-3.532 2.985-7.652 3.275-10.72.208-2.191-.323-4.275-1.324-5.192-.893-.82-2.41-1.122-3.935-.783-2.525.56-4.625 2.74-6.312 6.55-.394.892-.973 2.47-1.133 3.09l-.415 1.609a71.142 71.142 0 0 0-.421 1.693c-.04.187-.138.625-.218.974l-.213.931c-.037.163-.128.582-.201.932-.073.349-.229 1.073-.346 1.608-.116.536-.307 1.431-.424 1.99-.116.559-.27 1.283-.342 1.609-.072.326-.167.764-.21.973l-.21.974c-.073.326-.191.879-.264 1.228-.142.681-.335 1.58-.671 3.132-.116.536-.267 1.24-.334 1.567-.068.326-.197.935-.288 1.354l-.3 1.397c-.075.35-.192.883-.262 1.186-.069.303-.164.722-.21.931-.214.963-.387 1.653-.809 3.218-1.038 3.849-2.457 7.027-4.115 9.22-.226.298-.41.57-.41.604 0 .034.848.336 1.884.671s1.979.642 2.095.682c.377.13 2.395.747 3.048.933.35.1.75.213.89.254 2.896.833 5.336 1.331 7.847 1.602 1.496.16 3.508.062 5.34-.261.314-.056.59-.083.612-.061.037.037-.392 1.064-.98 2.342a7.46 7.46 0 0 0-.247.57c0 .172-.468.989-.615 1.072-.264.15-3.586.147-4.55-.003-2.61-.406-4.01-.687-5.968-1.2-1.871-.489-2.623-.702-4-1.135a1050.857 1050.857 0 0 0-2.731-.855l-1.376-.431c-.82-.259-2.78-.843-3.464-1.034l-.479-.133-.706.596c-1.198 1.01-2.928 2.15-3.84 2.532-.167.07-.559.244-.871.388-.714.33-2.568.944-3.404 1.128-1.995.44-4.425.57-6.265.335zm4.106-1.1c1.261-.166 1.88-.307 3.006-.688.883-.298 2.489-1.05 3.217-1.506 1.204-.753 2.832-2.169 2.664-2.315-.045-.039-.253-.12-.462-.18-.21-.06-.477-.14-.593-.177-.116-.038-.44-.133-.72-.213-.28-.08-.66-.193-.846-.252-.316-.1-3.427-.867-4.276-1.056-2.195-.487-4.866-.73-6.52-.592-2.921.242-4.436 1.047-4.811 2.556-.131.526-.125.757.034 1.304.252.867.995 1.593 2.28 2.225.625.308.816.38 1.65.615 1.343.378 3.692.5 5.377.279zm72.517.226c-.07-.038-.66-.213-1.312-.387-4.866-1.306-6.17-1.816-7.01-2.746-.474-.526-.441-.79.189-1.51 1.983-2.262 3.648-3.502 5.452-4.055l.493-.152-.028-.469-.028-.47.482-.024c.558-.03.62.035.752.771.258 1.45.196 1.72-.324 1.4-.585-.362-1.47-.174-2.396.51-.305.225-.61.52-.679.654-.127.25-.491.826-1.146 1.812-.458.69-.597 1.059-.46 1.224.154.185 1.107.656 1.23.609.063-.024.157-.315.215-.663.155-.93.388-1.462.917-2.092.597-.713 1.006-1.074 1.403-1.24.277-.115.348-.115.697.004.766.26.755.218.256.953-.585.865-1.1 1.874-1.319 2.59-.238.776-.23.951.055 1.125 1.447.884 3.126 2.244 2.752 2.23a.602.602 0 0 1-.19-.073zm-37.251-.157c.002-.07.589-.701 2.19-2.35 2.223-2.292 7.883-8.573 7.883-8.75 0-.043-.247-.6-.55-1.237-.303-.637-.55-1.17-.55-1.185 0-.015-.167-.384-.371-.82-.204-.436-.467-1.002-.585-1.258-.117-.256-.372-.809-.567-1.228-.194-.419-.431-.933-.526-1.143-.095-.21-.34-.738-.544-1.174a21.94 21.94 0 0 1-.37-.815c0-.012-.23-.506-.51-1.098-.806-1.698-.789-1.647-.567-1.735.103-.04.473-.195.822-.343.35-.147.915-.377 1.256-.51l.62-.242.551 1.16.839 1.763.702 1.482.857 1.809.68 1.439c1.14 2.44 1.136 2.433 1.317 2.269.494-.448 4.699-5.486 7.353-8.81l.422-.529h1.387c.836 0 1.376.032 1.359.08-.016.044-.333.397-.706.784-1 1.037-2.87 3.043-4.402 4.724-.744.815-1.524 1.67-1.734 1.902-.21.23-.65.708-.976 1.06-.842.91-1.93 2.122-2.043 2.275-.105.143-.078.219.562 1.579l.676 1.44c.174.372.489 1.039.699 1.48.21.443.497 1.053.637 1.356.14.302.445.95.677 1.439l.739 1.566c.827 1.761 1.017 2.165 1.323 2.82.18.387.329.74.329.784 0 .047-.74.08-1.818.08h-1.818l-.225-.488-.67-1.46c-.246-.536-.626-1.355-.844-1.82a149.45 149.45 0 0 1-.57-1.228c-.095-.21-.306-.667-.469-1.016a292.44 292.44 0 0 1-1.015-2.201c-.14-.303-.335-.73-.434-.948-.1-.218-.212-.416-.25-.44-.065-.04-1 1.02-2.01 2.277-.225.279-.696.853-1.048 1.275-.352.422-.774.932-.937 1.135-.982 1.218-3.223 3.936-3.615 4.384l-.463.53H97.73c-.74 0-1.346-.03-1.345-.064zm48.81-6.397c.019-.056.052-.273.073-.482.022-.21.045-.381.052-.381.007 0 .026-.115.044-.254.017-.14.071-.56.12-.932.29-2.219.36-3.015.317-3.533-.026-.315-.018-.573.019-.573s.177.095.313.211c.135.117.28.212.321.212.152 0-.25 3.699-.455 4.191-.038.093-.191.481-.339.862-.148.38-.321.712-.385.736-.066.025-.1.001-.08-.057zm3.702-.432c-.344-.352-.444-.514-.444-.719 0-.388.237-1.9.342-2.18.26-.696.964-2.16 1.417-2.951.134-.233.368-.652.52-.931.152-.28.306-.547.342-.593.036-.047.191-.313.345-.593.153-.28.342-.622.42-.762.205-.371.57-1.438.717-2.093.302-1.357.406-4.334.185-5.315-.138-.613-.431-1.684-.776-2.837-.306-1.024-.307-1.094-.014-1.128.131-.015.444.038.696.117.52.164.434.007 1.095 1.998.84 2.528.823 2.431.827 4.56.003 1.48-.03 2.064-.143 2.624-.136.67-.543 2.025-.725 2.413-.044.093-.208.493-.366.889-.424 1.063-.527 1.28-2.246 4.74-.868 1.745-1.616 3.183-1.662 3.195-.047.011-.285-.184-.53-.434zm-10.446-.52a29.51 29.51 0 0 0-.025-.589c-.008-.14-.022-.53-.031-.868l-.017-.613h-2.231c-2.257 0-2.435-.02-3.166-.348a2.723 2.723 0 0 0-.413-.16c-.03 0-.783-.36-1.673-.801-1.51-.748-1.664-.846-2.296-1.464-1.278-1.25-2.496-2.83-3.19-4.137l-.355-.668-.027-1.22-.026-1.22-.382-.64c-.352-.591-.38-.684-.38-1.22 0-1.049.316-2.803.652-3.617.125-.302.362-.76.526-1.016.264-.41.296-.522.279-.952-.014-.342.012-.49.087-.494.058-.004.497-.001.975.007.932.015.805.053 1.907-.578.176-.1.404-.184.508-.184.422-.001.855-.198 1.223-.556.353-.343.423-.375.818-.377.964-.005 1.349-.192 3.628-1.766.538-.372 1.3-.687 1.66-.687.273 0 .977.421 1.106.662.077.145-.042.294-.947 1.185-1.216 1.196-1.631 1.573-2.632 2.386a30.1 30.1 0 0 0-.894.747 3.998 3.998 0 0 1-.354.287 24.95 24.95 0 0 0-.965.734c-.56.436-1.61 1.177-2.492 1.76-.746.494-1.73 1.44-2.537 2.436l-.474.587.01 1.168c.005.654.047 1.216.096 1.276.048.059.114.274.148.478.142.862.894 2.224 1.714 3.103 1.084 1.163 4.417 3.536 5.697 4.056.63.256 1.234.28 2.088.085 1.165-.267 1.513-.573 1.451-1.279l-.028-.325.433-.025c.404-.024.438-.01.526.212.116.293.41 1.4.577 2.17.134.62.146.519-.251 2.117-.16.644-.307.803-.322.348zm-.98-6.381c-.416-.232-.869-.593-1.345-1.072-.423-.425-.965-1.142-.966-1.28 0-.037-.055-.172-.12-.298-.22-.422-.323-1.163-.266-1.922.104-1.37.266-2.493.364-2.526.054-.018.238-.144.41-.281.172-.137.343-.248.38-.248.071 0 .208.61.293 1.312.088.726.402 2.321.608 3.09l.19.72c.163.62.529 1.826.675 2.227.089.242.136.438.105.435a1.878 1.878 0 0 1-.329-.157zm-32.367-11.554c0-.155.487-1.328.585-1.408.028-.023.223-.251.432-.507.71-.869 3.25-3.34 4.565-4.442.113-.095.42-.363.684-.596a176.224 176.224 0 0 1 1.694-1.482c.392-.342.94-.796 1.438-1.193.302-.24.666-.538.809-.66.644-.552 2.179-1.618 2.329-1.618.053 0 .077.202.062.514-.028.571.05.493-1 .996-1.467.705-1.578.79-3.608 2.784-2.277 2.238-4.98 5.089-5.86 6.183-.156.194-.36.44-.453.547a9.618 9.618 0 0 0-.43.554c-.255.352-.27.36-.754.36-.271 0-.493-.014-.493-.032zm13.049-.049c-.304-.076-.386-.11-1.098-.46-.514-.251-.759-.27-1.241-.097-.777.28-1.265.061-1.692-.76-.471-.906-.367-.84-.93-.582-.579.265-.5.295-1.536-.583-.733-.62-.777-.693-.916-1.512-.046-.27-.029-.313.14-.359.273-.073 1.528-.063 1.647.013.055.035.112.234.127.443.027.371.034.38.324.384 1.153.016 1.178.022 1.347.313.363.628.901 1.415.968 1.417.04 0 .386-.155.77-.345.638-.316.727-.339 1.016-.259.174.048.561.241.86.429l.545.341.443-.281c.752-.478.772-.477 2.204.11l.661.27.47-.137c.259-.075.487-.12.508-.1.02.022-.07.32-.203.662l-.241.623-.66-.029c-.662-.03-.987.044-1.746.394-.334.154-1.335.213-1.768.105zm-15.441-.695c-.292-.106-.291-.167.007-.512.132-.153.33-.393.442-.533.307-.385 3.345-3.405 4.006-3.98.32-.279.706-.621.859-.76.152-.14.624-.538 1.048-.885.424-.346.77-.678.77-.738 0-.12-.294-.676-.463-.876-.28-.33-.578-1.02-.686-1.589-.142-.741-.151-1.486-.034-2.813.076-.853.556-3.853.638-3.987a7.63 7.63 0 0 0 .165-.703c.075-.359.154-.702.177-.762.025-.064-.29-.38-.76-.76-1.1-.895-1.623-1.484-2.351-2.65a36.9 36.9 0 0 1-.686-1.127 17.97 17.97 0 0 0-.363-.637c-.614-1.043-.738-1.393-.694-1.95.037-.475.287-1.127.517-1.35.273-.265 1.014-.621 1.577-.759.845-.206 2.554-.263 4.12-.137 1.235.1 1.685.18 2.696.476.28.082.727.165.994.185.455.034.516.015.932-.284.244-.177.92-.724 1.503-1.217 1.618-1.37 2.412-1.946 2.86-2.074.22-.062.485-.14.59-.173l.19-.06v4.54c0 2.496-.031 4.539-.07 4.539-.063 0-.96-1.746-1.327-2.583a25.97 25.97 0 0 0-.311-.677c-.1-.207-.214-.768-.293-1.44a33.742 33.742 0 0 0-.173-1.312 10.667 10.667 0 0 1-.086-.529c-.026-.191-.09-.317-.16-.317-.313 0-3.145 2.743-3.977 3.852-.844 1.127-1.84 3.012-2.53 4.79-.12.307-.217.592-.217.635 0 .043-.05.174-.11.29-.242.472-.916 2.678-1.124 3.683-.077.373-.178.792-.223.931-.134.407-.179 2.629-.074 3.599.053.489.141 1.355.196 1.926.1 1.04.168 1.194.404.911.057-.07.567-.477 1.132-.905a97.021 97.021 0 0 0 1.51-1.165c.732-.587 1.316-1.021 1.372-1.021.096 0 .05.645-.056.778-.058.073-.525.468-1.037.878-.512.41-.95.767-.973.793-.024.027-.424.353-.89.725-.465.373-.884.72-.93.771-.047.052-.657.584-1.355 1.182-.699.598-1.312 1.128-1.363 1.177a238.51 238.51 0 0 0-4.357 4.09c-.681.65-.673.645-1.033.514zm7.658-20.031c.07-.082.328-.53.571-.995.243-.466.475-.886.515-.935.04-.048.188-.342.327-.653l.254-.566-.736-.528c-.405-.29-.756-.556-.78-.59-.045-.063-.36-.152-1.298-.365-.62-.142-.71-.223-.574-.522.103-.226.104-.226.843-.178.649.042.983.122 1.665.4 1.022.416 1.563.5 1.88.293.239-.156.703-.632.703-.721 0-.029-.486-.117-1.08-.196a68.167 68.167 0 0 1-1.64-.237c-.565-.094-1.573-.056-2.276.086-.21.042-.666.124-1.016.181-.883.145-.918.17-.846.611.171 1.05.753 2.192 1.74 3.415.426.529 1.488 1.648 1.563 1.648.031 0 .115-.067.185-.148zm41.187 18.546-.663-.214.282-.303.388-.419c.058-.064.283-.39.5-.725 1.06-1.63 1.586-3.627 1.978-7.508.23-2.282.78-5.135 1.152-5.982.064-.147.117-.302.117-.345 0-.134 1.099-2.063 1.538-2.7 1.194-1.734 2.196-2.617 3.923-3.456.698-.34 1.356-.644 1.46-.677.256-.08.37-.317.306-.635-.065-.328-.22-.372-1.343-.38-.784-.007-.878.011-1.27.237-.66.38-.95.618-1.911 1.575a24.956 24.956 0 0 0-2.127 2.39c-1.344 1.698-2.421 4.375-2.855 7.094-.463 2.903-.836 4.608-1.274 5.826-.29.807-.916 2.048-1.031 2.048-.146 0-.665-.245-.665-.313 0-.037.079-.182.174-.322.404-.593 1.007-2.096 1.223-3.048.198-.87.39-2.726.462-4.445.106-2.537.154-3.188.255-3.508.046-.143.177-.564.291-.937.35-1.137 1.193-2.688 2.053-3.78 1.224-1.554 2.598-2.763 3.852-3.388 1.18-.588 1.936-.775 3.162-.783 1.166-.007 1.32.048 2.417.875l.61.458-.046.437c-.06.584-.48 1.497-.744 1.62-2.452 1.135-3.53 1.806-4.602 2.864-.929.917-1.107 1.148-1.697 2.205-.541.971-.684 1.539-.891 3.556-.048.466-.143 1.19-.211 1.609-.068.419-.164 1.124-.213 1.566-.05.442-.124.976-.165 1.185-.042.21-.12.63-.173.932-.29 1.651-.91 4.219-1.122 4.656-.339.7-1.449 2.238-1.966 2.726-.3.283-.325.283-1.174.01zm-1.707-2.568c-2.512-1.517-2.792-1.643-3.992-1.807-.875-.12-2.14-.203-3.3-.218-.29-.004-.436-.074-.833-.401-.43-.354-.501-.386-.655-.29-.289.18-.923.342-1.58.401l-.624.057.108-.203c.122-.228 1.135-1.476 1.586-1.953.252-.266.364-.319.791-.368.407-.047.527-.1.658-.282.215-.304.6-1.115.607-1.278.003-.081.339-.297.866-.558l.86-.425.135-.987c.125-.911.188-1.093.484-1.407a1.67 1.67 0 0 0 .204-.296c.054-.1.282-.42.508-.71.225-.29.41-.568.41-.616 0-.195.364-1.675.49-1.991.074-.187.258-.53.408-.762.553-.856.62-1.32.445-3.05l-.095-.941.219-.347c.45-.714.333-1.022-.347-.909-.637.106-1.937.385-2.369.509-.244.07-.663.187-.931.262-.268.074-1.387.432-2.485.795-1.558.515-2.318.821-3.45 1.388-.798.4-1.49.726-1.538.726-.07 0-.508-.824-.508-.955 0-.035.316-.173 1.016-.442.21-.081.457-.18.55-.219.245-.104 3.335-1.114 4.234-1.385.419-.126.914-.28 1.1-.344.187-.063.854-.253 1.482-.423 1.282-.347 1.586-.436 2.077-.603.188-.064.41-.116.493-.116a.786.786 0 0 0 .308-.084c.15-.08.144-.11-.101-.572-.417-.785-.745-1.2-.903-1.145a27.72 27.72 0 0 0-1.07.445c-.093.04-.569.233-1.058.428-.489.196-1.06.43-1.27.522-.21.091-.61.262-.889.38-.822.347-.99.42-1.505.652-.269.121-.51.22-.537.22-.103 0-1.815.895-2.445 1.278a70.84 70.84 0 0 1-.624.375c-.157.092-.495.308-.752.478-.257.171-.517.292-.578.268-.062-.023-.215-.178-.342-.345l-.23-.302.247-.201c.267-.218 3.144-1.65 4.142-2.064.785-.325 2.84-1.17 3.386-1.392.373-.152.936-.395 1.251-.54.316-.145.596-.264.624-.264.106 0 1.283-.58 1.329-.655.076-.123-.348-.856-.849-1.466-.404-.491-1.675-1.645-2.11-1.916-.151-.094-.143-.116.137-.388.543-.527.595-.532 1.177-.103.284.209.555.38.603.38.047 0 .123-.086.168-.19.046-.106.117-.249.159-.318.297-.5.685-1.64.849-2.498l.224-1.185c.158-.833.193-2.457.086-3.944-.082-1.151-.103-1.184-.59-.948-1.035.503-2.082 1.549-3.287 3.283l-1.313 1.884c-.204.29-.432.529-.506.529-.203 0-.872-.448-.873-.585 0-.096.689-1.204.847-1.362.023-.024.08-.104.127-.18.386-.622.86-1.148 2.013-2.23.735-.69 1.319-1.272 1.297-1.293-.086-.087-.946.467-1.765 1.137-1.032.842-1.514 1.278-2.656 2.403l-.856.843-.223-.292c-.123-.16-.223-.333-.223-.383 0-.164 3.923-4.024 4.657-4.58.75-.57.888-.66 1.532-.983.46-.232 1.465-.421 1.794-.339.307.077.683.482.97 1.043l.372.728c.076.15.262.635.414 1.078.434 1.266.434 2.682 0 4.849-.165.826-.473 1.827-.603 1.962a.386.386 0 0 0-.077.232c0 .084-.423.57-.94 1.081-.516.511-.926.966-.91 1.01.017.043.444.562.95 1.152.644.75.963 1.06 1.059 1.032.136-.041.81-.313 1.342-.54.15-.064.531-.212.847-.328.315-.116.65-.246.742-.29.281-.13 1.737-.6 2.398-.774.34-.09.905-.171 1.253-.182.586-.017.646-.003.797.194.09.116.164.315.165.443.002.26-.041.276-.93.362-.636.061-2.91.499-3.471.668l-.762.228c-.513.153-1.664.63-1.915.795-.11.073-.202.17-.202.217 0 .046.185.322.41.612.227.29.516.708.644.93.232.401.232.401.693.401 1.126 0 2.088-.166 2.71-.468.333-.162.65-.294.707-.294.176 0 .59.342.722.595.214.414.112 1.431-.136 1.361-.066-.018-.32-.102-.564-.186-.368-.126-.687-.15-1.862-.135l-1.418.016-.05.516c-.048.498-.12.678-.741 1.853-.147.278-.268.576-.268.662 0 .086.134.559.297 1.051.163.492.296.956.296 1.031 0 .075-.134.358-.297.628-.162.27-.296.507-.296.528 0 .02-.124.237-.275.482-.263.427-.277.494-.325 1.547-.063 1.377-.085 1.421-1.577 3.084-.209.233-.245.373-.324 1.246l-.054.605-.457.057c-.251.032-.568.113-.704.18-.33.165-.76.652-1.098 1.243-.152.265-.314.505-.36.534-.047.029-.12.143-.162.253a.42.42 0 0 1-.27.241c-.893.184-.84.214.33.186.66-.015 1.404.004 1.651.043.62.097 1.551.406 2.059.683l.762.415c.926.505 2.528 2.125 2.777 2.808.075.205.024.186-.745-.278zm-26.168-5.06-.514-.025-.204-.398-.232-.457c-.016-.032.117-.081.294-.109a29.276 29.276 0 0 0 2.525-.529c.164-.043 2.243-2.032 2.243-2.146 0-.031-.314-.081-.698-.112-1.294-.102-2.642-.232-3.189-.308-.61-.084-.77-.205-1.58-1.192-.49-.597-.533-.76-.37-1.388.298-1.15 1.005-2.043 2.438-3.078.607-.439 1.882-1.113 2.105-1.113a.699.699 0 0 0 .258-.076c.23-.12.786-.251 1.223-.29.443-.04.604.068.705.471.053.213.026.246-.311.392-1.081.467-2.993 1.455-3.12 1.611a4.428 4.428 0 0 1-.382.3c-.513.376-.688.568-1.014 1.109-.315.523-.397.919-.172.833.069-.027.421-.416.783-.866.361-.449.695-.845.742-.879.047-.034.378-.063.737-.063.636-.001.741-.026 1.485-.352.197-.087.385-.158.419-.158.033 0 .484-.214 1.003-.476.995-.503 1.14-.66 1.14-1.24 0-.121.038-.245.085-.274.104-.064.48.356.74.826.18.326.19.438.19 2.093v1.75l-.516.613c-.284.338-.497.634-.472.659.025.024.552.043 1.173.042.82-.002 1.212-.038 1.437-.132.184-.078.595-.442 1.01-.895l.701-.764h.541c.662 0 .687-.15-.323 1.916-.74 1.516-.754 1.536-1.07 1.609-.177.04-1.255.073-2.396.073-1.7 0-2.11.023-2.27.127-.109.07-.313.366-.454.657-.283.583-1.133 1.492-1.713 1.832-.635.372-1.437.482-2.977.407zm-10.866-4.826c-.41-.433-.79-1.234-.836-1.764l-.038-.434.524-.518c.559-.554.72-.63 1.24-.588l.33.027.042.547.043.547.354.088c.194.048.381.117.416.151.079.081.373.912.373 1.054 0 .06-.372.356-.825.66-.993.663-1.186.69-1.623.23zm10.877-10.365a36.78 36.78 0 0 0-.179-1.802 87.969 87.969 0 0 1-.207-1.778c-.13-1.256-.421-2.943-.53-3.076-.064-.076-.196-.1-.385-.069-.213.035-.351 0-.533-.134-.135-.1-.245-.21-.245-.243 0-.072 1.138-.844 1.862-1.262.163-.094.371-.218.463-.276.714-.451 2.457-1.362 3.093-1.616.21-.084.457-.187.55-.23.47-.213 2.007-.521 3.176-.638 1.75-.174 4.068-.197 4.572-.046.888.267 1.547.51 1.882.694.081.044.186.08.232.08.145 0 1.272.527 1.272.594 0 .143-.982.518-1.472.563-.284.026-1.127-.002-1.872-.062a37.763 37.763 0 0 0-1.972-.115l-.617-.005-.77 1.481c-1.653 3.18-2.374 4.584-3.05 5.942-.387.777-.736 1.415-.777 1.418-.043.003-.045-1.672-.006-3.91.037-2.153.065-4.001.062-4.106-.014-.4-.058-.425-.546-.318-1.292.28-1.637.498-1.77 1.117-.039.177-.131.57-.206.873-.075.303-.17.703-.211.89-.041.186-.138.567-.214.846a34.8 34.8 0 0 0-.295 1.185c-.085.373-.236.982-.336 1.355-.1.373-.214.849-.253 1.058-.083.449-.584 2.386-.628 2.43-.017.018-.058-.36-.09-.84zm14.823-4.203c-.367-.369-.652-.704-.635-.744.095-.22.849-1.286 1.026-1.452.237-.22.684-.317 1.096-.238.232.045.313.126.477.471.24.51.342 1.195.246 1.673-.066.332-.108.374-.596.61-.894.433-.86.44-1.614-.32z"
        className={pathClassName}
        transform="translate(-50.326 -94.053)"
      />
    </svg>
  );
};