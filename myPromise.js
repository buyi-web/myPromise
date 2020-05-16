
const MyPromise = (()=>{
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
        constructor (executor){
            this[PromiseValue] = undefined;
            this[PromiseStatus] = PENDING;
            this[thenable] = [];
            this[catchable] = [];
        
            //推向已决阶段的函数
            const resolve = (data) =>{
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

        then(thenHandle, catchHandle){
            this[settled](thenHandle, RESOLVED, this[thenable]);
            if(typeof catchHandle !== 'function'){
                return;
            }
            this.catch(catchHandle);
        }
        catch(catchHandle){
            this[settled](catchHandle, REJECTED, this[catchable]);
        }

        [changeStatus](newStatus, newVal, queue){
            if(this[PromiseStatus]  !== PENDING){ 
                return; //promise的状态是不可逆的
            }
            this[PromiseStatus] = newStatus,
            this[PromiseValue] = newVal;

            //状态改变时，执行相应队列中的函数
            queue.forEach(handle=>{
                handle(this[PromiseValue]);
            })
        }
        [settled](handle, status, queue){
            if(this[PromiseStatus] === status){  //处于已决状态直接执行函数
                setTimeout(()=>{
                    handle(this[PromiseValue])
                },0)
            }else{  //不是已决状态添加带任务队列中
               queue.push(handle)
            }
        }
    }
})()

