<template><div><h2 id="位异或运算" tabindex="-1"><a class="header-anchor" href="#位异或运算" aria-hidden="true">#</a> ^ 位异或运算</h2>
<p>运算规则：两个数转为二进制，然后从高位开始比较，如果  相同  则为0，不相同  则为1</p>
<p>比如：8^11</p>
<p>8转为二进制是1000，11转为二进制是1011.从高位开始比较得到的是：0011.然后二进制转为十进制，就是Integer.parseInt(&quot;0011&quot;,2)=3</p>
</div></template>


