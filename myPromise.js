
const MyPromise = (() => {
    const PENDING = 'pending',
        RESOLVED = 'resolved',
        REJECTED = 'rejected',
        PromiseValue = Symbol('PromiseValue'),
        PromiseStatus = Symbol('PromiseStatus'),
        thenable = Symbol('thenable'),
        catchable = Symbol('catchable'),
        settled = Symbol('settled'), //已决阶段的通用函数
        changeStatus = Symbol('changeStatus'); //改变promise状态



    return class {
        /**
         * 
         * @param {*} executor 未决状态下的处理函数
         */
        constructor(executor) {
            this[PromiseValue] = undefined;
            this[PromiseStatus] = PENDING;
            this[thenable] = [];
            this[catchable] = [];

            //推向已决阶段的函数
            const resolve = (data) => {
                this[changeStatus](RESOLVED, data, this[thenable]);
            }
            const reject = (data) => {
                this[changeStatus](REJECTED, data, this[catchable]);
            }
            try {
                executor(resolve, reject)
            } catch (error) {
                console.log(1);
                this[changeStatus](REJECTED, error); //捕获错误，有错误推向reject
            }

        }

        then(thenHandle, catchHandle) {
            return new MyPromise((resolve, reject) => {
                //在当前promise执行then或catch时可确定返回promise的已决状态
                this[settled]((data) => {
                    try {
                        var result = thenHandle(data);
                        //返回的是一个promise对象的处理
                        if (result instanceof MyPromise) {
                            result.then(data => {
                                resolve(data)
                            }, err => {
                                reject(err)
                            })
                        } else {
                            resolve(result)
                        }
                    } catch (error) {
                        reject(error)
                    }
                }, RESOLVED, this[thenable]);
                this[settled](data => {
                    try {
                        if (typeof catchHandle === 'function') {
                            var result = catchHandle(data);
                            reject(result);
                        }
                    } catch (error) {
                        reject(error)
                    }
                }, REJECTED, this[catchable])
            })
        }
        catch(catchHandle) {
            return new MyPromise((resolve, reject) => {
                this[settled](data => {
                    try {
                        var result = catchHandle(data);
                        reject(result)
                    } catch (error) {
                        reject(error)
                    }
                }, REJECTED, this[catchable])
            });
        }
        

        [changeStatus](newStatus, newVal, queue) {
            if (this[PromiseStatus] !== PENDING) {
                return; //promise的状态是不可逆的
            }
            this[PromiseStatus] = newStatus,
                this[PromiseValue] = newVal;

            //状态改变时，执行相应队列中的函数
            if (queue == null || queue.length == 0) {
                return;
            }
            queue.forEach(handle => {
                handle(this[PromiseValue]);
            })
        }
        [settled](handle, status, queue) {
            if (typeof handle !== 'function') {
                return;
            }
            if (this[PromiseStatus] === status) {  //处于已决状态直接执行函数
                setTimeout(() => {
                    handle(this[PromiseValue])
                }, 0)
            } else {  //不是已决状态添加带任务队列中
                queue.push(handle)
            }
        }

        static all(proms){
            return new MyPromise((resolve, reject)=>{
                const results = proms.map( p =>{
                    const obj = {
                        result: undefined,
                        isResolved: false
                    }
                    p.then(data =>{  //这里是异步的 results已经初始化了
                        obj.result = data;
                        obj.isResolved = true;

                        //每个promise执行都要判断是否有未resolved的
                        const unResolved = results.filter(r => !r.isResolved);
                        if(unResolved.length == 0){
                            //没有未resolved的 (全部resolved)
                            resolve(results);
                        }
                    }, err=>{
                        reject(err)
                    })
                    return obj;
                })
            })
        }
        static race(proms){
            return new MyPromise((resolve, reject)=>{
                proms.forEach(p =>{
                    p.then(data=>{
                        resolve(data)
                    }, err=>{
                        reject(err)
                    })
                })
            })
        }

        static resolve(data){
            if(data instanceof MyPromise){
                return data;
            }
            return new MyPromise(resolve=>{
                resolve(data)
            })
        }
        static reject(data){
            return new MyPromise(reject=>{
                reject(data);
            })
        }
    }
})()

