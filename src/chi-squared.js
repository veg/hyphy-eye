!function(e) {
    if("object"==typeof exports&&"undefined"!=typeof module) 
        module.exports=e();
    else if("function"==typeof define&&define.amd)
        define([],e);
    else{
        ("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).chiSquared=e()
    }
}(
    function(){
        var define,module,exports;
        return function(){
            return function e(r,t,o){
                function n(a,u){
                    if(!t[a]){
                        if(!r[a]){
                            var i="function"==typeof require&&require;
                            if(!u&&i)
                                return i(a,!0);
                            if(f)
                                return f(a,!0);
                            var d=new Error("Cannot find module '"+a+"'");
                            throw d.code="MODULE_NOT_FOUND",d
                        }
                        var c=t[a]={exports:{}};
                        r[a][0].call(c.exports,function(e){return n(r[a][1][e]||e)},c,c.exports,e,r,t,o)
                    }
                    return t[a].exports
                }
                for (var f="function"==typeof require&&require,a=0;a<o.length;a++)
                    n(o[a]);
                return n
            }
        }()({
            1:[function(require,module,exports){
                var LogGamma=require("gamma").log;
                function Gcf(X,A){
                    var A0=0,B0=1,A1=1,B1=X,AOLD=0,N=0;
                    while(Math.abs((A1-AOLD)/A1)>1e-5){
                        AOLD=A1;
                        N++;
                        A0=A1+(N-A)*A0;
                        B0=B1+(N-A)*B0;
                        A1=X*A0+N*A1;
                        B1=X*B0+N*B1;
                        A0/=B1;
                        B0/=B1;
                        A1/=B1;
                        B1=1;
                    }
                    var Prob=Math.exp(A*Math.log(X)-X-LogGamma(A))*A1;
                    return 1-Prob
                }
                function Gser(X,A){
                    var T9=1/A,
                        G=T9,
                        I=1;
                    while(T9 > 1e-5*G){
                        T9 = T9 * X / (A + I);
                        G += T9;
                        I += 1;
                    }
                    G *= Math.exp(A * Math.log(X) - X - LogGamma(A));
                    return G
                }
                function Gammacdf(e,r){
                    return e<=0?0:e<r+1?Gser(e,r):Gcf(e,r)
                }
                module.exports=function(e,r){
                    if(r<=0)
                        throw new Error("Degrees of freedom must be positive");
                    return Gammacdf(e/2,r/2)
                }
            },{
                gamma:3
            }],
            2:[function(e,r,t){
                var o=e("gamma");
                t.pdf=function(e,r){
                    if(e<0)
                        return 0;
                    var t=r/2;
                    return 1/(Math.pow(2,t)*o(t))*Math.pow(e,t-1)*Math.exp(-e/2)
                },
                t.cdf=e("./cdf")
            },{
                "./cdf":1,gamma:3
            }],
            3:[function(e,r,t){
                var o=[
                    .9999999999998099,676.5203681218851,
                    -1259.1392167224028,
                    771.3234287776531,
                    -176.6150291621406,
                    12.507343278686905,
                    -.13857109526572012,
                    9984369578019572e-21,
                    1.5056327351493116e-7
                ],
                n=607/128,
                f=[
                    .9999999999999971,
                    57.15623566586292,
                    -59.59796035547549,
                    14.136097974741746,
                    -.4919138160976202,
                    3399464998481189e-20,
                    4652362892704858e-20,
                    -9837447530487956e-20,
                    .0001580887032249125,
                    -.00021026444172410488,
                    .00021743961811521265,
                    -.0001643181065367639,
                    8441822398385275e-20,
                    -26190838401581408e-21,
                    36899182659531625e-22
                ];
                function a(e){
                    if(e<0)
                        return Number("0/0");
                    for(var r=f[0],t=f.length-1;t>0;--t)
                        r+=f[t]/(e+t);
                    var o=e+n+.5;
                    return .5*Math.log(2*Math.PI)+(e+.5)*Math.log(o)-o+Math.log(r)-Math.log(e)
                }
                r.exports=function e(r){
                    if(r<.5)
                        return Math.PI/(Math.sin(Math.PI*r)*e(1-r));
                    if(r>100)
                        return Math.exp(a(r));
                    r-=1;
                    for(var t=o[0],n=1;n<9;n++)
                        t+=o[n]/(r+n);
                    var f=r+7+.5;
                    return Math.sqrt(2*Math.PI)*Math.pow(f,r+.5)*Math.exp(-f)*t
                },
                r.exports.log=a
            },{}
            ]},{},[2])(2)
    }
);